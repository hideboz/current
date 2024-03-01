/* Copyright (C) 2024 Hideaki Sakai

This file is part of Hide-X-Community-Notes.

Hide-X-Community-Notes is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Hide-X-Community-Notes is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Hide-X-Community-Notes.  If not, see <https://www.gnu.org/licenses/>.
*/

let onFlag = true;
const SAVEKEY = "onFlag";

// Community Note patterns
// 閲覧したユーザーが他のユーザーにとって役立つと思う背景情報を追加しました
// Readers added context they thought people might want to know
const matchList = ["背景情報を追加しました", "people might want to know", "Readers added context", ];

// <SPAN>タグ内が Community Notes の識別にマッチするかどうかをチェックする関数
function checkCommunityNote(elem) {
    for (let child of elem.childNodes) {
        if (child.nodeType == Node.TEXT_NODE) {
            if (matchList.some(x => child.textContent.endsWith(x))) {
                // console.log(`child.textContent: |${child.textContent}|`); // debug
                return true;
            }
        }
    }
    
    return false;
}

// article ノードを探して、checkSPAN() を実行して true なら、要素を削除する
function recursiveReplace(elem) {
    if (onFlag && (elem.nodeType == Node.ELEMENT_NODE)) {
        for (let child of elem.childNodes) {
            if (child.tagName == "SCRIPT") {
                // pass
            }
            else if (child.tagName == "SPAN") {
                const returnVal = checkCommunityNote(child);
                if (returnVal) {
                    let communityNodeDiv = elem.parentNode.parentNode.parentNode;
                    communityNodeDiv.parentNode.removeChild(communityNodeDiv);
                    // console.log("COMMUNITY NOTE removed."); // debug
                    break;
                }
            }
            else {
                recursiveReplace(child);
            }
        }
    }
}

function onError(error) {
    console.error(`main:onError: ${error}`);
}

function onGot(item) {
    if (SAVEKEY in item) {
        onFlag = item[SAVEKEY]; // グローバル変数にセット
    }
}

// https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/storage/sync
function storageGet() {
    // return browser.storage.sync.get();
    return browser.storage.local.get();
}

storageGet()
.then(onGot)
.catch(onError);

// (変更を監視する) オブザーバーのオプション =======================================================
const config = { childList: true, subtree: true };

// The callback function takes as input two parameters:
// 1. An array of MutationRecord objects, describing each change that occurred; and
// 2. the MutationObserver which invoked the callback.
const callback = (mutationList) => {
    mutationList.forEach((mutation) => {
        recursiveReplace(mutation.target);
    });
}

// monitor the DOM (ページの更新を監視)
// https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
const observer = new MutationObserver(callback);

// 対象ノードの設定された変更の監視を開始
observer.observe(document.body, config);

