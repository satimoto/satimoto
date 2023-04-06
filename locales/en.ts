export default {
    // Buttons
    Button_Back: "Back",
    Button_Close: "Close",
    Button_ConfirmCharge: "Confirm Charge",
    Button_BackupMnemonic: "Backup Mnemonic",
    Button_ImportMnemonic: "Import Mnemonic",
    Button_Login: "Login",
    Button_Next: "Next",
    Button_Ok: "Ok",
    Button_OpenSettings: "Open Settings",
    Button_Pay: "Pay",
    Button_Phone: "Phone",
    Button_Receive: "Receive",
    Button_Send: "Send",
    Button_Start: "Start",
    Button_Stop: "Stop",
    Button_Switch: "Switch to {{text}}",
    Button_Website: "Website",
    // Labels
    Label_Kwh: "kWh",
    Label_Hour: "hour",
    Label_Parking: "hour parking",
    Label_Open: "Open",
    Label_Closing: "Closing",
    Label_Closed: "Closed",
    // Modal
    ClearTransactionsModal_Text: "Which tranactions should be cleared?",
    ClearTransactionsModal_ClearFailedText: "Failed",
    ClearTransactionsModal_ClearAllText: "All",
    CloseChannelModal_Title: "Close Channel",
    CloseChannelModal_ChannelPointError: "Invalid channel point",
    CloseChannelModal_CloseError: "Could not close channel",
    ConfirmationModal_BackendTooltipTitle: "Breez SDK Available!",    
    ConfirmationModal_BackendTooltipText: "You can now switch to the Breez SDK backend. Using Breez SDK enables faster syncing using Greenlight, improved battery usage and more reliable payments.",    
    ConfirmationModal_OpenUriText: "Open in your default browser?",    
    ConfirmationModal_StartConfirmationText: "If the cable is locked, press Start first then connect the cable",    
    ConfirmationModal_StopConfirmationText: "Are you sure you want to end this charging session?",    
    FilterModal_ExperimentalText: "Experimental Locations",
    FilterModal_RemoteCapableText: "Application Start/Stop",
    FilterModal_RfidCapableText: "Card Start/Stop",
    LnUrlAuthModal_Title: "Do you want to login to",
    ReceiveLightningModal_Title: "Amount to receive",
    ScanNfcModal_Title: "Tap an NFC card",
    ScanNfcModal_SchemeError: "Check the NFC card type",
    SendLightningModal_Title: "Paste a lightning invoice",
    SendToAddressModal_Title: "Send to a lightning address",
    SwapBackendModal_BreezSdkText: "When switching to {{backend}}, your Breez SDK node will still be available in other applications. You can also switch back to Breez SDK if you prefer later.",
    SwapBackendModal_LndText: "When switching your LND backend to {{backend}}, first do the steps below:",
    SwapBackendModal_SendText: "Send all lightning and on-chain funds to wallets you control.",
    SwapBackendModal_CloseText: "Close any channels you have on the current backend.",
    TokensInfoModal_Text: "To use RFID cards with Satimoto you must ensure the application:",
    TokensInfoModal_SyncedText: "Has been opened and synced within the last 5 days.",
    TokensInfoModal_FundedText: "Is funded with a minimum of {{satoshis}} sats.",
    // Components
    CameraScanner_PermissionTitle: "Camera Permission",
    CameraScanner_PermissionMessage: "Satimoto needs access to your Camera",
    CircularProgressButton_TooltipText: "Please wait a moment while we finish syncing",
    MnemonicInput_PlaceholderText: "Word {{no}}",
    OnChain_Text: "Enter a Bitcoin address to send funds to:",
    OnChain_ControlText: "Make sure you are in control of this address.",
    OnChain_ConfirmText: "This transaction may take several blocks to confirm.",
    ReceiveActionsheet_ReceiveQr: "Receive via QR code",
    ReceiveActionsheet_ReceiveNfc: "Receive via NFC card",
    ReceiveLightning_OpeningFeeText: "An opening fee of {{fee}} sats will be deducted.",
    ReceiveLightning_FeeInfoText: "{{name}} has a minimum fee of {{minimumFee}} sats or {{percentFee}}% of the amount received.",
    SendActionsheet_SendAddress: "Send to a lightning address",
    SendActionsheet_SendLightning: "Paste a lightning invoice",
    SendActionsheet_SendNfc: "Send via NFC card",
    SessionInvoiceButton_PaymentDueText: "Payment Due",
    SessionInvoiceButton_PayingText: "Paying...",
    SessionInvoiceButton_TapToPayText: "Tap to pay",
    Tariff_StartDateText: "available from {{startDate}}",
    Tariff_EndDateText: "available until {{startDate}}",
    Tariff_StartEndDateText: "available from {{startDate}} until {{startDate}}",
    Tariff_StartTimeText: "starting at {{startTime}}",
    Tariff_EndTimeText: "ending at {{startTime}}",
    Tariff_StartEndTimeText: "between {{startTime}} and {{startTime}}",
    Tariff_DayOfWeekText: "on {{dayOfWeek}}",
    Tariff_MinKwhText: "from {{min}} kWh charged",
    Tariff_MaxKwhText: "up to {{max}} kWh charged",
    Tariff_MinMaxKwhText: "from {{min}} and up to {{max}} kWh charged",
    Tariff_MinPowerText: "from {{min}} kW charging speed",
    Tariff_MaxPowerText: "up to {{max}} kW charging speed",
    Tariff_MinMaxPowerText: "from {{min}} and up to {{max}} kW charging speed",
    Tariff_MinDurationText: "from {{min}} minutes charging",
    Tariff_MaxDurationText: "up to {{max}} minutes charging",
    Tariff_MinMaxDurationText: "from {{min}} and up to {{max}} minutes charging",
    TokenButton_Subtitle: "NFC Charge Card",
    // Screens
    ChargeDetail_HeaderTitle: "Charging",
    ConnectorDetail_HeaderTitle: "Connector",
    ConnectorDetail_ExperimentalText: "The performance of this charge point is not known. Excess costs may occur, but will always be refunded at the end of the charging session.",
    ConnectorDetail_StartInfoText: "Connect the charging cable and press \"Start\". If the cable is locked, first press \"Start\" then connect the cable.",
    ConnectorDetail_ConfirmChargeText: "Your charging session is still pending, press \"Confirm Charge\" to confirm charging has started and earn some satsback.",
    ConnectorDetail_NfcStartText: "Tap your NFC card on the charge point to start charging.",
    ConnectorDetail_NfcStopText: "Tap your NFC card on the charge point to stop charging.",
    ConnectorDetail_AwaitingPaymentError: "Please pay any unpaid invoices before starting a new session.",
    ConnectorDetail_ChargeStatusError: "Currently charging at another charge point.",
    ConnectorDetail_EvseStatusError: "Unfortunately this charge point is {{status}}.",
    ConnectorDetail_LocalBalanceError: "Please add a minimum of {{satoshis}} sats to start charging.",
    ConnectorDetail_PriceDisclaimerText: "Operator costs may vary due to tariff prices and available charging data. Energy costs are per kWh, time costs are per hour. Any excess costs will be refunded at the end of the charging session.",
    ConnectorDetail_OperatorInfoText: "If you encounter problems with this charge point, please find the operator contact information at or around the charge point location.",
    ConnectorDetail_EvseIdentityText: "EVSE: {{evseId}}",
    ConnectorDetail_LocationText: "Name: {{name}}",
    EvseList_HeaderTitle: "Charge Points",
    WaitForPayment_HeaderTitle: "Receive Payment",
    WaitForPayment_ExpiryPlural: "Expires in {{minutes}} minutes",
    WaitForPayment_Expiry: "Expires in 1 minute",
    WaitForPayment_ChannelRequestNegotiatingText: "Negotiating channel opening",
    WaitForPayment_ChannelRequestOpenedText: "Payment channel opened",
    LnUrlPay_HeaderTitle: "Send Payment",
    LnUrlPay_AmountError: "Must be between {{minSats}} and {{maxSats}} sats",
    LnUrlPay_PayReqError: "Payment request invalid",
    LnUrlWithdraw_HeaderTitle: "Receive Payment",
    LnUrlWithdraw_AmountError: "Must be between {{minSats}} and {{maxSats}} sats",
    LnUrlWithdraw_PayReqError: "Payment request invalid",
    PaymentRequest_HeaderTitle: "Send Payment",
    PdfViewer_HeaderTitle: "Pdf",
    PdfViewer_InvoiceTitle: "Invoice",
    Scanner_DataError: "Error reading data",
    Scanner_UnrecognizedEvseIdError: "Charge Point not found",
    Settings_HeaderTitle: "Settings",
    Settings_ButtonCharging: "Charging",
    Settings_ButtonPayments: "Payments",
    Settings_ButtonAdvanced: "Advanced",
    Settings_ButtonLearn: "Learn",
    SettingsAdvanced_HeaderTitle: "Advanced",
    SettingsAdvanced_BatteryOptimizationText: "Battery Optimisation",
    SettingsAdvanced_BatteryOptimizationHint: "Disable optimisation to improve payment streaming",
    SettingsAdvanced_ChannelsText: "Channels",
    SettingsAdvanced_BackendsText: "Lightning Backends",
    SettingsAdvanced_OnChainText: "On-chain Wallet",
    SettingsAdvanced_SendReportText: "Send Error Report",
    SettingsAdvanced_IncludeChannelReserveText: "Include Channel Reserve",
    SettingsAdvanced_IncludeChannelReserveHint: "Show balance with reserved channel fees included",
    SettingsBackends_HeaderTitle: "Lightning Backends",
    SettingsBackends_BreezSdkText: "Breez SDK",
    SettingsBackends_LndText: "LND",
    SettingsBackend_HeaderTitle: "Lightning Backend",
    SettingsBackend_ActiveText: "ACTIVE",
    SettingsBackend_InactiveText: "INACTIVE",
    SettingsBackend_ImportMnemonicText: "Import your Backup Phrase from an existing Breez SDK application to share access to the same backend.",
    SettingsBattery_HeaderTitle: "Battery",
    SettingsBattery_AboutText: "Information about battery capacity and charge power help more accurately calculate invoices when charging.",
    SettingsBattery_MoreInfoText: "You can find more information about your vehicle at:",
    SettingsBattery_CapacityText: "Battery Capacity",
    SettingsBattery_CapacityHint: "Useable capacity in kilowatt-hours",
    SettingsBattery_CapacitySubtext: "In EV Database listed as \"Battery - Useable capacity\" in kilowatt-hours",
    SettingsBattery_PowerAcText: "AC Charge Power",
    SettingsBattery_PowerAcHint: "Max AC charge power in kilowatts",
    SettingsBattery_PowerAcSubtext: "In EV Database listed as \"Home / Destination - Charge Power\" in kilowatts",
    SettingsBattery_PowerDcText: "DC Charge Power",
    SettingsBattery_PowerDcHint: "Max DC charge power in kilowatts",
    SettingsBattery_PowerDcSubtext: "In EV Database listed as \"Fast Charging - Fastcharge Power (max)\" in kilowatts",
    SettingsChannel_HeaderTitle: "Channel",
    SettingsChannel_CapacityText: "CAPACITY",
    SettingsChannels_HeaderTitle: "Channels",
    SettingsCharging_HeaderTitle: "Charging",
    SettingsCharging_ButtonBattery: "Battery",
    SettingsCharging_ButtonTokens: "Cards",
    SettingsCharging_ButtonSessions: "Charge Sessions",
    SettingsBackupMnemonic_HeaderTitle: "Backup Mnemonic",
    SettingsBackupMnemonic_BreezSdkBackupText: "Carefully store this mnemoic in a safe place. You can use it with other Breez SDK applications to share the same lightning node.",
    SettingsBackupMnemonic_LndBackupText: "Carefully store this Mnemoic in a safe place. ",
    SettingsImportMnemonic_HeaderTitle: "Import Mnemonic",
    SettingsImportMnemonic_MnemonicError: "Please check your mnemonic and try again.",
    SettingsLearn_HeaderTitle: "Learn",
    SettingsLearn_BitcoinWhitepaperText: "Bitcoin Whitepaper",
    SettingsLearn_CypherpunksManifestoText: "A Cypherpunk's Manifesto",
    SettingsOnChain_HeaderTitle: "On-chain Wallet",
    SettingsOnChain_BalanceText: "BALANCE",
    SettingsPayments_HeaderTitle: "Payments",
    SettingsSendReport_HeaderTitle: "Send Report",
    SettingsSendReport_Text: "Send an email report about an issue or error you are experiencing. Log and node data will be included in the report.",
    SettingsSession_HeaderTitle: "Charge Session",
    SettingsSessions_HeaderTitle: "Charge Sessions",
    SettingsTokens_HeaderTitle: "Cards",
    SettingsTokens_AboutModelText: "To use RFID cards with Satimoto you must ensure the application has been opened and synced within the last 5 days and is funded with a minimum of 50,000 satoshis.",
    SettingsTokens_EmptyInfoTitle: "Use any NFC card to manage your charge sessions",
    SettingsTokens_EmptyInfoIOSTitle: "Use the QR code scanner to scan in your received NFC card",
    SettingsTokens_EmptyInfoSubtitle: "avoid other charge cards",
    Welcome_OnboardingSlide1Title: "Satimoto",
    Welcome_OnboardingSlide1Subtitle: "Electric vehicle charging with Bitcoin.",
    Welcome_OnboardingSlide2Title: "Privacy Focused Charging",
    Welcome_OnboardingSlide2Subtitle: "A new way to charge your electric vehicle, without compromising your privacy.",
    Welcome_OnboardingSlide3Title: "Pay As You Charge",
    Welcome_OnboardingSlide3Subtitle: "No need to give credit card details, simply fund your application with bitcoin, then stream micro-payments instantly as you charge your vehicle.",
    Welcome_ImportButton: "Import Backup",
    Welcome_StartButton: "Start!",
    // Errors
    InvoiceFailure_Expired: "Expired",
    PaymentFailure_Error: "Payment Error",
    PaymentFailure_IncorrectPaymentDetails: "Incorrect payment details",
    PaymentFailure_InsufficientBalance: "Insufficient balance",
    PaymentFailure_NoRoute: "No route",
    PaymentFailure_Timeout: "Timeout",
    PaymentFailure_Expired: "Expired",
    // Backend
    BREEZ_SDK: "Breez SDK",
    LND: "LND",
    // Evse status
    AVAILABLE: "Available",
    BLOCKED: "Not accessible",
    CHARGING: "Busy",
    INOPERATIVE: "Not available",
    OUTOFORDER: "Out of order",
    PLANNED: "Coming soon",
    REMOVED: "Removed",
    RESERVED: "Reserved",
    UNKNOWN: "Unknown",
    // Connector format
    SOCKET: "Socket",
    CABLE: "Cable",
    // Connector standard
    CHADEMO: "CHAdeMO",
    DOMESTIC_A: "NEMA 1-15",
    DOMESTIC_B: "NEMA 5-15",
    DOMESTIC_C: "CEE 7/17",
    DOMESTIC_D: "3 pin",
    DOMESTIC_E: "CEE 7/5",
    DOMESTIC_F: "CEE 7/4, Schuko",
    DOMESTIC_G: "BS 1363, Commonwealth",
    DOMESTIC_H: "SI-32",
    DOMESTIC_I: "AS 3112",
    DOMESTIC_J: "SEV 1011",
    DOMESTIC_K: "DS 60884-2-D1",
    DOMESTIC_L: "CEI 23-16-VII",
    IEC_60309_2_single_16: "IEC 60309-2, 16 Amp",
    IEC_60309_2_three_16: "IEC 60309-2, 3-Phase/16 Amp",
    IEC_60309_2_three_32: "IEC 60309-2, 3-Phase/32 Amp",
    IEC_60309_2_three_64: "IEC 60309-2, 3-Phase/64 Amp",
    IEC_62196_T1: "IEC 62196 Type 1",
    IEC_62196_T1_COMBO: "Combo Type 1, DC",
    IEC_62196_T2: "IEC 62196 Type 2",
    IEC_62196_T2_COMBO: "Combo Type 2, DC",
    IEC_62196_T3A: "IEC 62196 Type 3A",
    IEC_62196_T3C: "IEC 62196 Type 3C, Scame",
    TESLA_R: "Tesla Roadster type",
    TESLA_S: "Tesla Model-S type",
    // Energy source
    NUCLEAR: "Nuclear",
    GENERAL_FOSSIL: "Fossil mix",
    COAL: "Coal",
    GAS: "Gas",
    GENERAL_GREEN: "Green mix",
    SOLAR: "Solar",
    WIND: "Wind",
    WATER: "Water"
}
