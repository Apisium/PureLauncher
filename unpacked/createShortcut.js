/* eslint-disable no-var */
/* global WScript */
var args = WScript.Arguments
var Shell = WScript.CreateObject('WScript.Shell')
var link = Shell.CreateShortcut(Shell.SpecialFolders('Desktop') + '\\' + args(0) + '.lnk')
link.TargetPath = args(1)
link.Arguments = args(2).replace(/\*\?#!\*/g, '"')
link.Description = args(3)
link.IconLocation = args(4)
link.Save()
