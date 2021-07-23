'use strict'

import { app, protocol, BrowserWindow, session, Menu, ipcMain, dialog } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import path from 'path'
import checkFileTampered from './background/checkFileTampered'
require('bytenode')
process.chdir(path.join(process.resourcesPath, '../')) // 防止使用命令行打开本应用时，js找不到jsc
const isDevelopment = process.env.NODE_ENV !== 'production'
app.commandLine.appendSwitch('--disable-http-cache')

let mainWindow

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow () {
  const appMenu = Menu.buildFromTemplate([
    {
      label: '关于',
      submenu: [
        {
          label: '关于woa-getrer',
          click: () => {
            mainWindow.webContents.send('show-about')
          }
        }
      ]
    }
  ])
  Menu.setApplicationMenu(appMenu)
  global.sharedObject = {
    webviewPreload: path.join(__dirname, 'preload.js')
  }
  mainWindow = new BrowserWindow({
    width: 600,
    height: 500,
    minHeight: 500,
    minWidth: 600,
    webPreferences: {

      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      devTools: isDevelopment,
      javascript: true,
      webviewTag: true,
      nodeIntegration: true, // process.env.ELECTRON_NODE_INTEGRATION
      contextIsolation: false,
      webSecurity: false
    }
  })

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '复制',
      role: 'copy'
    },
    {
      label: '粘贴',
      role: 'paste'
    }
  ])
  // mainWindow.webContents.on('context-menu', () => {
  //   contextMenu.popup()
  // })

  ipcMain.on('pop-context-menu', () => {
    contextMenu.popup()
  })

  ipcMain.on('ask-global', (event, sharedObjectKey) => {
    event.returnValue = sharedObjectKey ? global.sharedObject[sharedObjectKey] : global.sharedObject
  })

  checkFileTampered().then(async () => {
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      await mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
      if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
    } else {
      createProtocol('app')
      // Load the index.html when not in development
      mainWindow.loadURL('app://./index.html')
    }
  }).catch(() => {
    dialog.showMessageBox(mainWindow, {
      message: '检测到软件已被篡改，请重新下载',
      type: 'warning',
      title: 'woa-getter'
    }).finally(() => {
      app.exit(0)
    })
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    await session.defaultSession.loadExtension(path.join(__dirname, '../vue-devtools'), { allowFileAccess: true })
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
