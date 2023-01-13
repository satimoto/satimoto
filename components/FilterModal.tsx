import ListSwitch from "components/ListSwitch"
import Modal from "components/Modal"
import { useStore } from "hooks/useStore"
import I18n from "i18n-js"
import { observer } from "mobx-react"
import { useColorModeValue, VStack } from "native-base"
import React, { useCallback, useEffect, useState } from "react"

interface FilterModalProps {
    isVisible: boolean
    onClose: () => void
}

const FilterModal = ({ isVisible, onClose }: FilterModalProps) => {
    const textColor = useColorModeValue("lightText", "darkText")
    const { uiStore } = useStore()
    const [filterExperimental, setFilterExperimental] = useState(false)
    const [filterRemoteCapable, setFilterRemoteCapable] = useState(false)
    const [filterRfidCapable, setFilterRfidCapable] = useState(false)

    useEffect(() => {
        setFilterExperimental(uiStore.filterExperimental)
        setFilterRemoteCapable(uiStore.filterRemoteCapable)
        setFilterRfidCapable(uiStore.filterRfidCapable)
    }, [])

    useEffect(() => {
        uiStore.setFilterExperimental(filterExperimental)
    }, [filterExperimental])

    useEffect(() => {
        uiStore.setFilterRemoteCapable(filterRemoteCapable)
    }, [filterRemoteCapable])

    useEffect(() => {
        uiStore.setFilterRfidCapable(filterRfidCapable)
    }, [filterRfidCapable])

    const onExperimentalChange = useCallback(() => {
        setFilterExperimental(!filterExperimental)
    }, [filterExperimental])

    const onRemoteCapableChange = useCallback(() => {
        setFilterRemoteCapable(!filterRemoteCapable)
    }, [filterRemoteCapable])

    const onRfidCapableChange = useCallback(() => {
        setFilterRfidCapable(!filterRfidCapable)
    }, [filterRfidCapable])

    return (
        <Modal isVisible={isVisible} onClose={onClose}>
            <VStack alignItems="center" space={5} width="100%">
                <ListSwitch
                    key="remotecapable"
                    title={I18n.t("FilterModal_RemoteCapableText")}
                    titleSize="xl"
                    isChecked={filterRemoteCapable}
                    onToggle={onRemoteCapableChange}
                />
                <ListSwitch
                    key="rfidcapable"
                    title={I18n.t("FilterModal_RfidCapableText")}
                    titleSize="xl"
                    isChecked={filterRfidCapable}
                    onToggle={onRfidCapableChange}
                />
                <ListSwitch
                    key="experimental"
                    title={I18n.t("FilterModal_ExperimentalText")}
                    titleSize="xl"
                    isChecked={filterExperimental}
                    onToggle={onExperimentalChange}
                />
            </VStack>
        </Modal>
    )
}

export default observer(FilterModal)
