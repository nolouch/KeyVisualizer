import React, { useState } from "react"
import ReactDOM from "react-dom"
import { Heatmap } from "~/components/heatmap"
import { HeatmapPage } from "~/pages/heatmap-page"
import "~/styles/global_styles.scss"

ReactDOM.render(
  <>
    <HeatmapPage />
  </>,
  document.getElementById("main-app")
)
