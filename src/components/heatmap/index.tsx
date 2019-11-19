import React, { RefObject, useRef, useCallback, useEffect } from "react"
import * as d3 from "d3"

export type HeatmapSelection = {
  startTime?: number
  endTime?: number
  startKey?: string
  endKey?: string
}

export type KeyAxisEntry = {
  key: string
  labels: string[]
}

export type HeatmapData = {
  timeAxis: number[]
  keyAxis: KeyAxisEntry[]
  values: number[][]
}

type HeatmapProps = {
  width: number
  height: number
  data: HeatmapData
  onZoom: (selection: HeatmapSelection) => void
}

export const Heatmap: React.FunctionComponent<HeatmapProps> = props => {
  const divRef: React.RefObject<HTMLDivElement> = useRef(null)

  useEffect(() => {
    if (divRef.current != null) {
      const div = divRef.current
      div.innerHTML = ""
      heatmapChart(
        d3.select(div),
        props.width,
        props.height,
        props.data,
        props.onZoom
      )
    }
  }, [props])

  return <div ref={divRef} />
}

function heatmapChart(
  container,
  width: number,
  height: number,
  data: HeatmapData,
  onZoom: (selection: HeatmapSelection) => void
) {
  const margin = { top: 25, right: 25, bottom: 60, left: 155 }
  const MSAARatio = 4
  const canvasWidth = width - margin.left - margin.right
  const canvasHeight = height - margin.top - margin.bottom

  const zoomBtn = container
    .append("button")
    .style("display", "block")
    .style("margin", "20px")
    .text("Zoom")

  const axis = container
    .append("svg")
    .style("width", width + "px")
    .style("height", height + "px")
    .style("position", "absolute")

  const canvas = container
    .append("canvas")
    .attr("width", canvasWidth * MSAARatio)
    .attr("height", canvasHeight * MSAARatio)
    .style("width", canvasWidth + "px")
    .style("height", canvasHeight + "px")
    .style("margin-top", margin.top + "px")
    .style("margin-right", margin.right + "px")
    .style("margin-bottom", margin.bottom + "px")
    .style("margin-left", margin.left + "px")

  const ctx = canvas.node().getContext("2d")
  ctx.imageSmoothingEnabled = false

  const dataCanvas = createLayer(data.values)

  const xScale = d3
    .scaleLinear()
    .domain([0, data.timeAxis.length - 2])
    .range([0, canvasWidth])

  const yScale = d3
    .scaleLinear()
    .domain([0, data.keyAxis.length - 2])
    .range([0, canvasHeight])

  const xAxis = d3
    .axisBottom(xScale)
    .tickFormat(idx =>
      data.timeAxis[idx] !== undefined
        ? d3.timeFormat("%B %d, %Y %H:%M:%S")(new Date(data.timeAxis[idx]))
        : ""
    )
    .ticks(width / 270)

  const yAxis = d3
    .axisRight(yScale)
    .tickFormat(idx =>
      data.keyAxis[idx] !== undefined ? data.keyAxis[idx].key : ""
    )
    .ticks(10)

  const labelAxis = categoryAxisGroup([
    dummyCategories,
    dummyCategories,
    dummyCategories,
  ])

  const xAxisSvg = axis
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + (height - 20) + ")")

  const yAxisSvg = axis
    .append("g")
    .attr("transform", "translate(0, " + margin.top + ")")

  const labelAxisSvg = axis
    .append("g")
    .attr("transform", "translate(20, " + margin.top + ")")

  const brush = d3
    .brush()
    .extent([
      [0, 0],
      [canvasWidth, canvasHeight],
    ])
    .on("end", brushEnd)

  const brushSvg = axis
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .style("display", "none")
    .call(brush)

  zoomBtn.on("click", startBrush)

  var lastZoomTransform

  function startBrush() {
    brushSvg.style("display", "")
  }

  function brushEnd() {
    brushSvg.style("display", "none")
    const selection = d3.event.selection

    if (selection) {
      brush.clear(brushSvg)
      const domainTopLeft = lastZoomTransform.invert(selection[0])
      const domainBottomRight = lastZoomTransform.invert(selection[1])
      const startTime =
        data.timeAxis[Math.round(xScale.invert(domainTopLeft[0]))]
      const endTime =
        data.timeAxis[Math.round(xScale.invert(domainBottomRight[0]))]
      const startKey =
        data.keyAxis[Math.round(yScale.invert(domainTopLeft[1]))].key
      const endKey =
        data.keyAxis[Math.round(yScale.invert(domainBottomRight[1]))].key

      onZoom({
        startTime: startTime,
        endTime: endTime,
        startKey: startKey,
        endKey: endKey,
      })
    }
  }

  const zoomBehavior = d3
    .zoom()
    .scaleExtent([1, 64])
    .translateExtent([
      [0, 0],
      [canvasWidth, canvasHeight],
    ])
    .extent([
      [0, 0],
      [canvasWidth, canvasHeight],
    ])
    .on("zoom", () => zoomed(d3.event.transform))

  function zoomed(transform) {
    lastZoomTransform = transform

    xAxisSvg.call(xAxis.scale(transform.rescaleX(xScale)))
    // yAxisSvg.call(yAxis.scale(transform.rescaleY(yScale)))
    hideTicksWithoutLabel(axis)
    labelAxisSvg.call(labelAxis)

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    ctx.drawImage(
      dataCanvas,
      xScale.invert(transform.invertX(0)),
      yScale.invert(transform.invertY(0)),
      xScale.invert(canvasWidth * (1 / transform.k)),
      yScale.invert(canvasHeight * (1 / transform.k)),
      0,
      0,
      canvasWidth * MSAARatio,
      canvasHeight * MSAARatio
    )
  }

  axis.call(zoomBehavior)

  zoomed(d3.zoomIdentity)
}

function hideTicksWithoutLabel(axis) {
  axis.selectAll(".tick text").each(function() {
    if (this.innerHTML === "") {
      this.parentNode.style.display = "none"
    }
  })
}

function createLayer(values: number[][]) {
  const maxValue = d3.max(values.map(array => d3.max(array)))
  const logScale = d3.scaleSymlog().domain([0, maxValue])
  const colorScale = d3.scaleSequential(d => d3.interpolateInferno(logScale(d)))

  const valueWidth = values.length
  const valueHeight = (values[0] || []).length
  const canvas = d3
    .create("canvas")
    .attr("width", valueWidth)
    .attr("height", valueHeight)
    .node() as HTMLCanvasElement
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
  const sourceImageData = ctx.createImageData(valueWidth, valueHeight)
  const imageData = sourceImageData.data

  for (var i = 0; i < imageData.length; i += 4) {
    const pixel = i / 4
    const x = pixel % valueWidth
    const y = Math.floor(pixel / valueWidth)
    const color = colorScale(values[x][y])
    // const rgb = color.substring(1, color.length - 1).split("", 2)

    imageData[i] = parseInt(color.substring(1, 3), 16) // R
    imageData[i + 1] = parseInt(color.substring(3, 5), 16) // G
    imageData[i + 2] = parseInt(color.substring(5, 7), 16) // B
    imageData[i + 3] = 255 // A
  }

  ctx.putImageData(sourceImageData, 0, 0)

  return canvas
}

type Category<T> = {
  name: string,
  start: T,
  end: T
}

type KeyCategory = Category<string>
type TransformedCategory = Category<number>

const categoryAxisWidth = 20
const dummyCategories: TransformedCategory[] = [
  { name: "test1", start: 0, end: 100 },
  { name: "test2", start: 100, end: 150 },
  { name: "test3", start: 270, end: 280 },
  { name: "test4", start: 290, end: 380 },
  { name: "test5", start: 400, end: 500 },
]

function categoryAxisGroup(groups, scale) {
  let transformedGroups = 
  const categoryAxisGroup = selection => {
    const g = selection.selectAll("g").data(groups)

    g.enter()
      .append("g")
      .each(function(categories, i) {
        const group = d3
          .select(this)
          .attr("transform", `translate(${i * (categoryAxisWidth + 8)}, 0)`)

        const rects = group.selectAll("rect").data(categories)
        const texts = group.selectAll("text").data(categories)

        rects
          .enter()
          .append("rect")
          .attr("width", categoryAxisWidth)
          .attr("height", category => category.end - category.start)
          .attr("x", 0)
          .attr("y", category => category.start)
          .attr("stroke", "black")
          // .attr('stroke-linejoin', 'round')
          .attr("fill", "grey")

        texts
          .enter()
          .append("text")
          .attr("fill", "black")
          .attr("writing-mode", "tb")
          .attr(
            "transform",
            category => `translate(0, ${category.end - 8}) rotate(180)`
          )
          .attr("dominant-baseline", "hanging")
          .text(category => category.name)
          .call(hideTextOverflow)
      })
  }

  categoryAxisGroup.rescale = function(scale) {

  }

  return categoryAxisGroup
}

function transformCategoryGroups(groups, scale) {

}

function hideTextOverflow(text) {
  text.style("display", category => {
    const textWidth = category.name.length * 9
    const rectWidth = category.end - category.start
    return rectWidth > textWidth ? "" : "none"
  })
}
