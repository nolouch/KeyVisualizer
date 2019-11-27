import React, { useState, useEffect } from "react"
import style from "./styles.scss"
import ReactDOM from "react-dom"
import { Heatmap, HeatmapData } from "~/components/heatmap"
import { fetchHeatmap, fetchDummyHeatmap, fetchHeatmapLocal } from "~api"

export const HeatmapPage: React.FunctionComponent = props => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData>()

  useEffect(() => {
    const load = async () => {
      if (!heatmapData) setHeatmapData(await fetchHeatmapLocal({}))
    }
    load()
  })

  return (
    <>
      <button style={{margin: 20, display:'block'}}>Zoom</button>
      {heatmapData && (
        <Heatmap
          width={1300}
          height={900}
          data={heatmapData}
          onRefresh={() => {}}
        />
      )}
    </>
  )
}
