# BetterSliders UserPlugin 安裝指南

BetterSliders 讓支援的 Discord 滑桿可以使用滑鼠滾輪調整，並能用右鍵開啟
Precise Input 輸入精確數值，同時保留原生拖曳、鍵盤及顯示行為。

這是非官方 Vencord UserPlugin。Vencord 將 UserPlugin 定位為進階、必須從原始碼建置的
功能，也不為第三方 UserPlugin 提供支援。修改 Discord 用戶端可能違反 Discord 的服務條款，
請自行評估風險。BetterSliders 的問題請回報至本專案，不要回報至 Vencord 上游支援管道。

## 你需要準備什麼

- Windows、macOS 或 Linux 電腦；
- Discord Desktop，或能載入自行建置 Vencord 的 Vesktop／瀏覽器；
- Git、Node.js 與 pnpm，且都已加入 `PATH`；
- BetterSliders release 內版本相同的 ZIP 與 `.sha256` 檔案。

先確認工具可用：

```sh
git --version
node --version
pnpm --version
```

若任何指令失敗，先依照 Vencord 官方的
[Installing Vencord](https://docs.vencord.dev/installing/) 指南安裝必要工具。官方也明確說明
UserPlugin 必須從原始碼建置；相關限制請見
[Installing custom plugins](https://docs.vencord.dev/installing/custom-plugins/)。

## 第一次安裝

### 1. 準備 Vencord 原始碼

如果你還沒有 Vencord 原始碼，選一個容易找到的位置並執行：

```sh
git clone https://github.com/Vendicated/Vencord.git
cd Vencord
pnpm install --frozen-lockfile
```

請使用 `pnpm`，不要改用 `npm` 或 `yarn`。如果你已有從原始碼建置的 Vencord，進入原本的
Vencord repository，更新至你要使用的版本，再執行一次 `pnpm install --frozen-lockfile`。

### 2. 下載並驗證 BetterSliders

從 BetterSliders GitHub Pre-release 下載以下兩個同版本檔案：

- `better-sliders-userplugin-v0.1.0-rc.2.zip`
- `better-sliders-userplugin-v0.1.0-rc.2.zip.sha256`

Windows PowerShell：

```powershell
$expected = (Get-Content .\better-sliders-userplugin-v0.1.0-rc.2.zip.sha256).Split()[0].ToLowerInvariant()
$actual = (Get-FileHash .\better-sliders-userplugin-v0.1.0-rc.2.zip -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $expected) { throw "BetterSliders checksum mismatch" }
```

Linux：

```sh
sha256sum --check better-sliders-userplugin-v0.1.0-rc.2.zip.sha256
```

macOS：

```sh
shasum -a 256 better-sliders-userplugin-v0.1.0-rc.2.zip
```

macOS 會顯示計算結果；請將第一欄與 `.sha256` 檔案的第一欄逐字比較。若驗證失敗，不要安裝，
請刪除下載檔並從 GitHub Release 重新下載。

### 3. 解壓縮至正確位置

在 Vencord repository 內建立 `src/userplugins`（若已存在就保留），再將 ZIP 解壓縮至其中。
完成後必須有以下路徑：

```text
Vencord/
└─ src/
   └─ userplugins/
      └─ betterSliders/
         ├─ index.ts
         ├─ components/
         ├─ tests/
         ├─ README.md
         ├─ COMPATIBILITY.md
         └─ manifest.json
```

最重要的檢查是這個檔案必須存在：

```text
Vencord/src/userplugins/betterSliders/index.ts
```

不要把 ZIP 本身放進 `src/userplugins`，也不要產生
`src/userplugins/betterSliders/betterSliders/index.ts` 這種多包一層的路徑。

### 4. 建置並套用

回到 Vencord repository 根目錄：

```sh
pnpm build
```

Discord Desktop 接著執行：

```sh
pnpm inject
```

在 Vencord Installer 選擇你實際使用的 Discord channel，完成後完整關閉並重新開啟 Discord。

Vesktop 使用者不執行 `pnpm inject`；請在 Vesktop Settings 的 **Vencord Location** 選擇這個
Vencord repository 的 `dist` 資料夾，然後完整重啟 Vesktop。瀏覽器使用者則依 Vencord 官方
來源建置文件執行 `pnpm buildWeb`，再安裝 `dist` 內對應的 extension 或 userscript。

### 5. 啟用 BetterSliders

開啟：

```text
Discord 使用者設定 → Vencord → Plugins
```

搜尋 **BetterSliders**，開啟右側切換鈕。齒輪按鈕可調整 Precise Input、Wheel Adjustment、
Shift／Ctrl 倍率與反轉滾輪方向。若 Vencord 要求重新啟動，請完整重啟 Discord。

## 確認安裝成功

1. 在 Discord 的輸入或輸出音量滑桿上滾動滑鼠滾輪。
2. 數值應依設定改變，並短暫顯示 Discord 原生數值提示。
3. 在支援的滑桿上按右鍵，應開啟「精確設定滑桿數值」。
4. 原生右鍵選單若原本存在，應保持開啟並位於 Precise Input 後方。

BetterSliders 只處理 Discord 共用 Slider 元件所產生的 Supported Slider。自製 DOM／CSS
假滑桿或沒有使用共用元件的控制項不在支援範圍內。

## 更新 BetterSliders

UserPlugin 不會被 Vencord 內建 Updater 更新。每次更新都要手動完成：

1. 下載新版本 ZIP 與 `.sha256` 並重新驗證。
2. 在 Discord 設定中停用 BetterSliders，然後完整關閉 Discord／Vesktop。
3. 備份目前的 `Vencord/src/userplugins/betterSliders`。
4. 移除舊的 `betterSliders` 資料夾，再將新版本解壓縮到相同位置。
5. 確認 `src/userplugins/betterSliders/index.ts` 存在。
6. 回到 Vencord 根目錄執行：

```sh
pnpm install --frozen-lockfile
pnpm build
```

Discord Desktop 再執行 `pnpm inject`；Vesktop／瀏覽器則重新套用其對應的自訂 build，最後重啟
用戶端並確認 BetterSliders 已啟用。

## 移除或復原

1. 在 Vencord Plugins 中停用 BetterSliders。
2. 完整關閉 Discord／Vesktop。
3. 只移除 `Vencord/src/userplugins/betterSliders` 資料夾。
4. 回到 Vencord 根目錄重新執行 `pnpm build`。
5. Discord Desktop 再執行 `pnpm inject`；其他平台重新套用對應 build。
6. 重啟用戶端並確認 Plugins 頁已沒有 BetterSliders。

若新版本建置失敗，可以把備份的上一個已驗證版本放回原位置後重建，或移除 BetterSliders 後
重建。BetterSliders 的 patch 無法匹配時設計上會 fail open，讓原生滑桿繼續運作；這不代表可以
忽略不相容版本，仍應移除或更新套件。

## 常見問題

### Plugins 頁找不到 BetterSliders

- 確認 ZIP 已解壓縮，而不是直接放在 `src/userplugins`。
- 確認是 `src/userplugins/betterSliders/index.ts`，沒有多包一層資料夾。
- 確認執行 build 的 terminal 位於正確的 Vencord repository。
- 重新執行 `pnpm install --frozen-lockfile`、`pnpm build`，並重新套用 custom build。

### 出現 `localeCompare` 相關錯誤

Vencord 官方指出，`src/userplugins` 內的空資料夾或空 plugin 檔案可能造成這個錯誤。移除空項目，
並只保留完整的 `betterSliders` 套件後重新建置。

### Build 顯示缺少套件或型別

先確認 Node.js 與 pnpm 版本符合目前 Vencord 的 `package.json`，再執行：

```sh
pnpm install --frozen-lockfile
pnpm build
```

### Checksum 不一致

不要繼續安裝。刪除 ZIP 與 `.sha256`，從本專案 GitHub Release 重新下載同一版本的兩個檔案。

### Discord 更新後功能失效

Discord bundle 大改可能讓共用 Slider patch 暫時無法匹配。先停用 BetterSliders 並查看是否已有
相容版本；不要把問題回報給 Vencord 上游。

## 回報問題

請至 <https://github.com/Command1264/Vencord/issues>，並附上：

- `manifest.json` 內的 BetterSliders 版本與 source commit；
- Vencord commit；
- Discord channel 與完整 build；
- 作業系統；
- 發生問題的 Slider 與允許範圍；
- 其他會修改 Slider 的 plugins；
- 可重現步驟、錯誤訊息與必要截圖。

套件相容性範圍請見同一資料夾內的 `COMPATIBILITY.md`。

## License

BetterSliders 以 GPL-3.0-or-later 發佈；完整授權文字包含在 `LICENSE`。
