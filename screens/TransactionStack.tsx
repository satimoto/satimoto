import useNavigationOptions from "hooks/useNavigationOptions"
import React from "react"
import { createNativeStackNavigator, NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RouteProp } from "@react-navigation/native"
import TransactionDetail from "screens/TransactionDetail"
import TransactionList from "screens/TransactionList"

export type TransactionStackParamList = {
    TransactionList: undefined
    TransactionDetail: { identifier: string }
}

export type TransactionListNavigationProp = NativeStackNavigationProp<TransactionStackParamList, "TransactionList">
export type TransactionDetailNavigationProp = NativeStackNavigationProp<TransactionStackParamList, "TransactionDetail">
export type TransactionDetailRouteProp = RouteProp<TransactionStackParamList, "TransactionDetail">

const TransactionStackNav = createNativeStackNavigator<TransactionStackParamList>()

const TransactionStack = () => {
    const navigationOptions = useNavigationOptions({ headerShown: true })

    return (
        <TransactionStackNav.Navigator initialRouteName="TransactionList" screenOptions={{ headerShown: false }}>
            <TransactionStackNav.Screen name="TransactionList" component={TransactionList} options={navigationOptions} />
            <TransactionStackNav.Screen name="TransactionDetail" component={TransactionDetail} options={navigationOptions} />
        </TransactionStackNav.Navigator>
    )
}

export default TransactionStack
