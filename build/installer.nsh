!macro customInstall
  DetailPrint "Register pure-launcher URI Handler"
  DeleteRegKey HKCR "pure-launcher"
  WriteRegStr HKCR "pure-launcher" "" "URL:pure-launcher"
  WriteRegStr HKCR "pure-launcher" "EveHQ NG SSO authentication Protocol" ""
  WriteRegStr HKCR "pure-launcher\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKCR "pure-launcher\shell" "" ""
  WriteRegStr HKCR "pure-launcher\shell\Open" "" ""
  WriteRegStr HKCR "pure-launcher\shell\Open\command" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME} %1"
!macroend
