import React, { useState, useEffect } from "react"
import style from "./styles.scss"
import { CardFootnote } from "~/components/card/card-footnote"
import { CardInfo } from "~/components/card/card-info"
import { Filter, RegionFilterAttibute } from "~/components/filter"
import { CardAction } from "~/components/card/card-action"
import { CardInteractTips } from "~/components/card/card-interact-tips"
import { PeerTagList, PeerTagValue } from "~/components/region/peer-tag"
import { Navigation } from "~/components/navigation"
import { StoreList } from "~/components/store/store-list"
import { StoreItem, StoreValue } from "~/components/store/store-item"
import { PeerMenu } from "~/components/region/peer-menu"
import { PeerList, PeerValue, RegionValue } from "~/components/region/peer-item"
import { genDummyStore } from "./dummy"
import {
  fetchMaxReplicas,
  transferLeader,
  fetchAllStores,
  deleteStore,
  upStore,
  fetchAllRegions,
  fetchRegion,
  addEvictLeaderScheduler,
  removeEvictLeaderScheduler,
  listSchedulers,
  queryHotRead,
} from "~/api"
import { fetchStoreValues } from "~api_converter"
import { storeUserAction, peerUserAction } from "~api_user_actions"

const randDummyStoreList: StoreValue[] = genDummyStore(10)

export const StoresPage: React.FunctionComponent = props => {
  const [regionFilter, setRegionFilter] = useState({
    normal: true,
    inAction: true,
    error: true,
  })
  const [searchInput, setSearchInput] = useState<string>("")
  const [storeList, setStoreList] = useState<StoreValue[]>([])

  useEffect(() => {
    const id = setInterval(async () => {
      const stores = await fetchStoreValues()
      setStoreList(stores)
    }, 1000)
    return () => {
      clearInterval(id)
    }
  }, [props])

  // const [searchInput, setSearchInput] = useState("")

  return (
    <div className={style["page-container"]}>
      {/* <ApiTester
        callme={() => fetchAllStores().then(j => console.log(j))}
        name={"test fetch stores"}
      />
      <ApiTester
        callme={() => deleteStore(2).then(j => console.log(j))}
        name={"test delete store"}
      />
      <ApiTester
        callme={() => upStore(2).then(j => console.log(j))}
        name={"test up store"}
      />
      <ApiTester
        callme={() => fetchAllRegions().then(j => console.log(j))}
        name={"test fetch regions of store"}
      />
      <ApiTester
        callme={() => fetchRegion(84).then(j => console.log(j))}
        name="test fetch a specific region"
      />
      <ApiTester
        callme={() => addEvictLeaderScheduler(1).then(j => console.log(j))}
        name="test add a scheduler to evict leader"
      />
      <ApiTester
        callme={() => removeEvictLeaderScheduler(1).then(j => console.log(j))}
        name="test remove a scheduler to evict leader"
      />
      <ApiTester
        callme={() => listSchedulers().then(j => console.log(j))}
        name="test list schedulers"
      />
      <ApiTester
        callme={() => fetchMaxReplicas().then(j => console.log(j))}
        name="test fetch maxReplicas"
      />
      <ApiTester
        callme={() => queryHotRead().then(j => console.log(j))}
        name="test fetch hot read"
      /> */}
      <Navigation />
      <div className={style["store-container"]}>
        <div key={0} className={style["padding-container"]}>
          <h2>{"Stores & Regions"}</h2>
          <Filter
            regionAttr={regionFilter}
            onRegionAttrChange={newAttr => setRegionFilter(newAttr)}
            onSearchInputChange={newValue => setSearchInput(newValue)}
          />
        </div>
        <div key={1} className={style["store-list-container"]}>
          <StoreList
            storeItems={storeList}
            // storeItems={randDummyStoreList}
            regionFilter={regionFilter}
            searchInput={searchInput}
            onStoreUserAction={(store, action) => {
              storeUserAction(store, action)
              console.log(store, action)
            }}
            onPeerUserAction={(peer, action) => {
              peerUserAction(peer, action)
              console.log(peer, action)
            }}
          />
        </div>
      </div>
      {/* <StoreItem store={dummyStore} selection={{type:"none"}} onSelectionChange={()=>{}} />
      <StoreItem store={dummyStore} selection={{type:"store"}} onSelectionChange={()=>{}} /> */}

      {/* <CardInteractTips title="Merge" tips="ecstas" onCancel={() => { }} /> */}
      {/* <CardFootnote
        isSelected={false}
        footnoteState="info"
        value="Hot Store"
        onMouseDown={() => { }}
      /> */}
      {/* <CardFootnote
        isSelected={true}
        footnoteState="error"
        value="Hot Store"
        onMouseDown={() => { }}
      />
      <CardInfo
        title="Missing Peers"
        info={[{ name: "Peers", value: "2" }, { name: "Expected", value: "3" }]}
      />
      <CardAction
        actions={[
          { name: "Split Region", onClick: () => { } },
          { name: "Delete", onClick: () => { } },
        ]}
      />
      <PeerTagList
        tags={[
          { name: "Missing Peer", type: "error" },
          { name: "Pending Peer", type: "error" },
          { name: "Adding", type: "inAction" },
        ]}
      />
      <PeerList
        peers={[dummyPeer, dummyPeer, dummyPeer]}
        selectedPeer={null}
        onSelectedPeerChanged={() => { }}
      /> */}
      {/* <PeerMenu
        peer={dummyPeer}
        onPeerUserAction={() => { }}
        onBlur={() => { }}
        offsetLeft={0}
      /> */}
    </div>
  )
}

type ApiTesterProps = {
  callme: () => void
  name?: string
}

const ApiTester: React.FunctionComponent<ApiTesterProps> = props => (
  <div>
    <button onClick={props.callme}>
      {props.name ? props.name : "test me"}
    </button>
  </div>
)
