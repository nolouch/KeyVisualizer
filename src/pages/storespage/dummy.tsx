import { PeerValue } from "~components/region/peer-item"
import { StoreValue } from "~components/store/store-item"
import _ from "lodash"

export const dummyRegion = {
  regionId: "22134231",
  startKey: "1820000092123",
  endKey: "1932300000349",
  regionSize: 283718,
  peersCount: 2,
}

const genDummyRegion = (regionId: string) => ({
  regionId: regionId,
  startKey: "1820000092123",
  endKey: "1932300000349",
  regionSize: 283718,
  peersCount: 2,
})

const genDummyPeer = (n: number) =>
  new Array(n).fill(null).map((e, idx) => ({
    peerId: Math.ceil(Math.random() * 4000000).toString(),
    peerState: "Leader",
    inActions: [
      { type: "Adding Learner" },
      // { type: "Promoting Learner" },
      // { type: "Transfer Leader", targetStore: 3 },
      // { type: "Removing" },
      // {
      //   type: "Spliting",
      //   startKey: "32141246",
      //   endKey: "2341251232",
      //   policy: "approximate",
      //   splitKeys: ["34552345", "2341234"],
      // },
      // {
      //   type: "Merging",
      //   fromRegionId: "32141246",
      //   toRegionId: "2341251232",
      //   isPassive: false,
      // },
    ],
    errors: [
      // { type: "Missing Peer", peers: 2, expected: 3 },
      // { type: "Extra Peer", peers: 4, expected: 3 },
      // { type: "Hot Read", flowBytes: 3000 },
      // { type: "Hot Write", flowBytes: 3000 },
    ],
    region: genDummyRegion(idx.toString()),
  }))

export const genDummyStore = (n: number) =>
  new Array(n).fill(null).map(
    (e, idx) =>
      ({
        storeId: (1000 + idx).toString(),
        capacity: "29 GiB",
        available: "250 GiB",
        address: "tikv1:20160",
        tikvVersion: "4.0.0-alpha",
        storeState: "Up",
        leaderCount: 6,
        leaderWeight: 1,
        leaderScore: 6,
        leaderSize: 6,
        regionCount: 20,
        regionWeight: 1,
        regionScore: 20,
        regionSize: 20,
        startTimestamp: "2019-10-25T01:52:15Z",
        latestHeartbeatTimestamp: "2019-10-25T08:11:58.651970456Z",
        uptime: "6h19m43.651970456s",
        schedulers: { evictingLeader: true },
        errors: [
          { type: "Hot Read", flowBytes: 3000 },
          { type: "Hot Write", flowBytes: 3000 },
          { type: "Store Down", downFrom: "2019-10-25T01:52:15Z" },
          { type: "Store Offline", offlineFrom: "2019-10-25T01:52:15Z" },
          {
            type: "Store Disconnected",
            disconnectedFrom: "2019-10-25T01:52:15Z",
          },
        ],
        peers: genDummyPeer(10),
      } as StoreValue)
  )
