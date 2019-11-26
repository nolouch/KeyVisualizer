import { KeyAxisEntry } from "."
import _ from "lodash"

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

export function labelAxisGroup(keyAxis: KeyAxisEntry[], originScale) {
  const groups = aggrKeyAxisLabel(keyAxis)
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

function aggrKeyAxisLabel(keyAxis: KeyAxisEntry[]): LabelGroup<KeyLabel>[] {
  var result = _.times(4, () => ({
    labels: [] as KeyLabel[],
    keyAxis: keyAxis,
  }))

  for (var groupIdx = 0; groupIdx < result.length; groupIdx++) {
    var lastLabel: string | null = null
    var startKey: string | null = null

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
        }
      }

      lastLabel = label
    }
  }

  return result
}
