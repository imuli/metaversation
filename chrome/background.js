function unique() {
  function r16() {
    return Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
  }
  return r16() + r16() + r16() + r16() + r16() + r16() + r16() + r16();
}
function addBySelection(info, tab){
	chrome.tabs.sendMessage(tab.id, {
		type: "getCurrentSelection",
		info: {
			type: 'node',
			url: info.pageUrl,
			text: info.selectionText,
			title: tab.title,
			icon: tab.favIconUrl,
		},
	}, function(resp){
		var objs = {};
		resp.id = unique();
		objs[resp.id] = resp;
		chrome.storage.local.set(objs);
		console.log(objs);
	});
	chrome.tabs.sendMessage(tab.id, {
		type: "updateHighlights",
	});
}

var overId;
function removeThis(info, tab){
	chrome.storage.local.remove(overId);
	chrome.tabs.sendMessage(tab.id, {
		type: "updateHighlights",
	});
}

var menus = {
	/* create node from selection */
	add: {
		id: "add",
		title: "Add",
		type: "normal",
		contexts: ["selection"],
		onclick: addBySelection,
	},
	/* remove context menu at cursor */
	remove: {
		id: "remove",
		title: "Remove",
		type: "normal",
		contexts: ["all"],
		onclick: removeThis,
	}
};

function copy(obj){
	var r = {};
	Object.keys(obj).map(function(a){
		r[a] = obj[a];
	});
	return r;
}

chrome.contextMenus.create(copy(menus.add));

function toggleMenu(event){
	if(event.type == 'mouseenter'){
		chrome.contextMenus.create(copy(menus.remove));
		chrome.contextMenus.remove('add');
		overId = event.target.id;
	} else {
		chrome.contextMenus.create(copy(menus.add));
		chrome.contextMenus.remove('remove');
	}
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	switch(request.type){
		case "menu":
			toggleMenu(request.event);
			break;
		default:
			console.log("Unknown request:", request, sender);
			break;
	}
});
