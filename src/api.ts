import { HeatmapData, HeatmapRange } from "~/components/heatmap"
import dummyData from '~/dummydata.json'

export const APIURL = "/pd/apis/keyvisual/v1"

export async function fetchDummyHeatmap() {
    return dummyData
}

export async function fetchHeatmap(selection: HeatmapRange) {
  var url = `${APIURL}/heatmaps?type=write_bytes`
  if (selection.startTime) url += `&startTime=${selection.startTime}`
  if (selection.endTime) url += `&endTime=${selection.endTime}`
  if (selection.startKey) url += `&startKey=${selection.startKey}`
  if (selection.endKey) url += `&endKey=${selection.endKey}`

  const data: HeatmapData = await sendRequest(url, "get")
  data.timeAxis = data.timeAxis.map(timestamp => timestamp)

  return data
}

export async function sendRequest(url: string, method: "get") {
  const res = await fetch(url, {
    method: method,
    mode: "cors",
  })
  return res.json()
}
