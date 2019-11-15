import React from "react"
import ReactDOM from "react-dom"
import {fetchDummyData} from '~/api'
import { Heatmap } from "~/components/heatmap"
import "~/styles/global_styles.scss"

ReactDOM.render(
  <>
    <Heatmap width={1500} height={800} data={fetchDummyData()} onZoom={()=> {}}/>
  </>,
  document.getElementById("main-app")
)
