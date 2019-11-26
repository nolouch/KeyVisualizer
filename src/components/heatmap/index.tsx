import React, { RefObject, useRef, useCallback, useEffect } from "react"
import * as d3 from "d3"
import _ from "lodash"
import { heatmapChart } from "./chart"

export type HeatmapRange = {
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
  onRefresh: (selection: HeatmapRange) => void
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
        props.onRefresh
      )
    }
  }, [props])

  return <div ref={divRef} />
}
