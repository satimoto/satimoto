import { StyleSheet } from "react-native"

export default StyleSheet.create({
    buttonIcon: {
        alignItems: "flex-end",
        justifyContent: "flex-start",
        paddingVertical: 3,
        paddingHorizontal: 3
    },
    center: {
        justifyContent: "center",
        alignItems: "center"
    },
    listButton: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 12
    },
    matchParent: {
        flex: 1
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 10,
        marginTop: 15,
        paddingHorizontal: 10,
        paddingVertical: 10
    },
    transactionButton: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 12
    },
    focusViewPanel: {
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 30,
        paddingHorizontal: 20,
        paddingTop: 10
    },
    focusViewBackground: {
        padding: 20
    },
    focusViewButton: {
        marginHorizontal: 20
    }
})
