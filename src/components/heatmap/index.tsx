import React, { RefObject, useRef, useCallback, useEffect } from "react"
import * as d3 from "d3"
import _ from "lodash"

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

  const tooltips = container
    .append("div")
    .style("width", width + "px")
    .style("height", height + "px")
    .style("position", "absolute")

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

  const labelAxis = labelAxisGroup(aggrKeyAxisLabel(data.keyAxis), yScale)

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
    .on('start', brushStart)
    .on("end", brushEnd)

  const brushSvg = axis
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .style("display", "none")
    .call(brush)

  zoomBtn.on("click", enableBrush)

  var zoomTransform

  function enableBrush() {
    brushSvg.style("display", "")
  }

  function brushStart() {
    hideTooltips()
  }

  function brushEnd() {
    brushSvg.style("display", "none")
    const selection = d3.event.selection

    if (selection) {
      brush.clear(brushSvg)
      const domainTopLeft = zoomTransform.invert(selection[0])
      const domainBottomRight = zoomTransform.invert(selection[1])
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
    .on("start", hideTooltips)

  function zoomed(transform) {
    zoomTransform = transform

    const rescaleX = zoomTransform.rescaleX(xScale)
    const rescaleY = zoomTransform.rescaleY(yScale)

    xAxisSvg.call(xAxis.scale(rescaleX))
    // yAxisSvg.call(yAxis.scale(rescaleY))
    hideTicksWithoutLabel(axis)
    labelAxisSvg.call(labelAxis.scale(rescaleY))

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    ctx.drawImage(
      dataCanvas,
      xScale.invert(zoomTransform.invertX(0)),
      yScale.invert(zoomTransform.invertY(0)),
      xScale.invert(canvasWidth * (1 / zoomTransform.k)),
      yScale.invert(canvasHeight * (1 / zoomTransform.k)),
      0,
      0,
      canvasWidth * MSAARatio,
      canvasHeight * MSAARatio
    )
  }

  function hoverBehavior(axis) {
    axis.on("mousemove", mousemove)
    axis.on("mouseout", hideTooltips)
    function mousemove() {
      const mouseTooltipOffset = d3.mouse(tooltips.node())
      const mouseCanvasOffset = d3.mouse(canvas.node())

      if (d3.event.movementX == 0 && d3.event.movementY == 0) return

      if (
        mouseCanvasOffset[0] < 0 ||
        mouseCanvasOffset[0] > canvasWidth ||
        mouseCanvasOffset[1] < 0 ||
        mouseCanvasOffset[1] > canvasHeight
      ) {
        hideTooltips()
        return
      }

      const rescaleX = zoomTransform.rescaleX(xScale)
      const rescaleY = zoomTransform.rescaleY(yScale)
      const timeIdx = Math.floor(rescaleX.invert(mouseCanvasOffset[0]))
      const keyIdx = Math.floor(rescaleY.invert(mouseCanvasOffset[1]))

      // Refactor Me
      const tooltipData = [
        {
          name: "Value",
          value: data.values[timeIdx][keyIdx],
        },
        {
          name: "Start Time",
          value: d3.timeFormat("%B %d, %Y %H:%M:%S")(
            new Date(data.timeAxis[timeIdx] * 1000)
          ),
        },
        {
          name: "End Time",
          value: data.timeAxis[timeIdx + 1]
            ? d3.timeFormat("%B %d, %Y %H:%M:%S")(
                new Date(data.timeAxis[timeIdx + 1] * 1000)
              )
            : "",
        },
        { name: "Start Key", value: data.keyAxis[keyIdx].key },
        {
          name: "End Key",
          value: data.keyAxis[keyIdx + 1] ? data.keyAxis[keyIdx + 1].key : "",
        },
      ]

      const tooltipDiv = tooltips.selectAll("div").data([null])

      tooltipDiv
        .enter()
        .append("div")
        .style("position", "absolute")
        .style("background-color", "#333")
        .style("color", "#eee")
        .style("padding", "5px")
        .merge(tooltipDiv)
        .style("left", mouseTooltipOffset[0] + 20 + "px")
        .style("top", mouseTooltipOffset[1] + 20 + "px")

      const tooltipEntries = tooltipDiv.selectAll("p").data(tooltipData)

      tooltipEntries
        .enter()
        .append("p")
        .style("font-size", "12px")
        .merge(tooltipEntries)
        .text(d => d.value)

      tooltipEntries.exit().remove()
      tooltipDiv.exit().remove()
    }
  }

  function hideTooltips() {
    tooltips.selectAll("div").remove()
  }

  axis.call(zoomBehavior)
  axis.call(hoverBehavior)

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

    imageData[i] = parseInt(color.substring(1, 3), 16) // R
    imageData[i + 1] = parseInt(color.substring(3, 5), 16) // G
    imageData[i + 2] = parseInt(color.substring(5, 7), 16) // B
    imageData[i + 3] = 255 // A
  }

  ctx.putImageData(sourceImageData, 0, 0)

  return canvas
}

type LabelGroup<Label> = {
  labels: Label[]
  keyAxis: KeyAxisEntry[]
}

type Label<T> = {
  name: string
  start: T
  end: T
}

type KeyLabel = Label<string>
type ScaledLabel = Label<number>

const labelAxisWidth = 20

function aggrKeyAxisLabel(keyAxis: KeyAxisEntry[]): LabelGroup<KeyLabel>[] {
  var result = _.times(4, () => ({
    labels: [] as KeyLabel[],
    keyAxis: keyAxis,
  }))

  for (var groupIdx = 0; groupIdx < result.length; groupIdx++) {
    var lastLabel: string | null = null
    var startKey: string | null = null
    var startKeyIdx = 0

    for (var keyIdx = 0; keyIdx < keyAxis.length; keyIdx++) {
      const key = keyAxis[keyIdx].key
      const label = keyAxis[keyIdx].labels[groupIdx]

      if (label != lastLabel) {
        if (startKey != null && lastLabel != null) {
          result[groupIdx].labels.push({
            name: lastLabel,
            start: startKey,
            end: key,
          })
          startKey = null
        }

        if (label != null) {
          startKey = key
          startKeyIdx = keyIdx
        }
      }

      lastLabel = label
    }
  }

  return result
}

function labelAxisGroup(groups: LabelGroup<KeyLabel>[], originScale) {
  var rescale = originScale
  const labelAxisGroup = selection => {
    let scaledGroups = groups.map(
      group => scaleLabelGroup(group, originScale, rescale).labels
    )

    const g = selection.selectAll("g").data(scaledGroups)

    g.enter()
      .append("g")
      .attr("transform", (d, i) => `translate(${i * (labelAxisWidth + 8)}, 0)`)
      .merge(g)
      .call(labelAxis)

    g.exit().remove()
  }

  labelAxisGroup.scale = function(val) {
    rescale = val
    return labelAxisGroup
  }

  return labelAxisGroup
}

function labelAxis(group) {
  const rects = group.selectAll("rect").data(d => {
    return d
  })
  const texts = group.selectAll("text").data(d => d)

  rects
    .enter()
    .append("rect")
    .attr("width", labelAxisWidth)
    .attr("x", 0)
    .attr("stroke", "black")
    .attr("fill", "grey")
    .merge(rects)
    .attr("y", label => label.start)
    .attr("height", label => label.end - label.start)

  rects.exit().remove()

  texts
    .enter()
    .append("text")
    .attr("fill", "black")
    .attr("writing-mode", "tb")
    .attr("font-size", "14")
    .merge(texts)
    .attr(
      "transform",
      label => `translate(${labelAxisWidth / 2}, ${label.end - 8}) rotate(180)`
    )
    .text(label => label.name)
    .call(hideTextOverflow)

  texts.exit().remove()
}

function scaleLabelGroup(
  group: LabelGroup<KeyLabel>,
  originScale,
  rescale
): LabelGroup<ScaledLabel> {
  var labels: ScaledLabel[] = []
  var lastKeyIdx = 0
  var mergedSmallLabel

  for (const label of group.labels) {
    const canvasStart = originScale.range()[0]
    const canvasEnd = originScale.range()[1]
    const startKeyIdx = _.findIndex(
      group.keyAxis,
      key => key.key == label.start,
      lastKeyIdx
    )
    const endKeyIdx = _.findIndex(
      group.keyAxis,
      key => key.key == label.end,
      lastKeyIdx
    )
    const startPos = rescale(startKeyIdx)
    const endPos = rescale(endKeyIdx)
    const commonStart = Math.max(startPos, canvasStart)
    const commonEnd = Math.min(endPos, canvasEnd)
    lastKeyIdx = endKeyIdx

    const mergeWidth = 3

    if (mergedSmallLabel != null) {
      if (
        mergedSmallLabel.end - mergedSmallLabel.start >= mergeWidth ||
        commonStart - mergedSmallLabel.end > mergeWidth
      ) {
        labels.push({
          name: "",
          start: mergedSmallLabel.start,
          end: mergedSmallLabel.end,
        })
        mergedSmallLabel = null
      }
    }

    if (commonEnd - commonStart > 0) {
      if (commonEnd - commonStart > mergeWidth) {
        labels.push({ name: label.name, start: commonStart, end: commonEnd })
      } else {
        if (mergedSmallLabel == null) {
          mergedSmallLabel = { start: commonStart, end: commonEnd }
        } else {
          mergedSmallLabel.end = commonEnd
        }
      }
    }
  }

  const result = {
    labels: labels,
    keyAxis: group.keyAxis,
  }

  return result
}

function hideTextOverflow(text) {
  text.style("display", label => {
    const textWidth = label.name.length * 9
    const rectWidth = label.end - label.start
    return rectWidth > textWidth ? "" : "none"
  })
}
