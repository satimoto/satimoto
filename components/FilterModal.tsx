import Modal from "components/Modal"
import { useStore } from "hooks/useStore"
import I18n from "i18n-js"
import { observer } from "mobx-react"
import { HStack, Switch, Text, useColorModeValue, VStack } from "native-base"
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
                <HStack justifyContent="space-between" width="100%">
                    <Text color={textColor} fontSize="xl">
                        {I18n.t("FilterModal_RemoteCapableText")}
                    </Text>
                    <Switch isChecked={filterRemoteCapable} onToggle={onRemoteCapableChange} size="md" />
                </HStack>
                <HStack justifyContent="space-between" width="100%">
                    <Text color={textColor} fontSize="xl">
                        {I18n.t("FilterModal_RfidCapableText")}
                    </Text>
                    <Switch isChecked={filterRfidCapable} onToggle={onRfidCapableChange} size="md" />
                </HStack>
                <HStack justifyContent="space-between" width="100%">
                    <Text color={textColor} fontSize="xl">
                        {I18n.t("FilterModal_ExperimentalText")}
                    </Text>
                    <Switch isChecked={filterExperimental} onToggle={onExperimentalChange} size="md" />
                </HStack>
            </VStack>
        </Modal>
    )
}

export default observer(FilterModal)
