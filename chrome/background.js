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
			url: info.pageUrl.split('#')[0],
			text: info.selectionText,
			title: tab.title,
			icon: tab.favIconUrl,
			time: new Date().getTime(),
		},
	}, function(resp){
		var objs = {};
		resp.id = unique();
		objs[resp.id] = resp;
		chrome.storage.local.set(objs);
		console.log(objs);
		chrome.tabs.sendMessage(tab.id, {
			type: "updateHighlights",
		});
	});
}
function addObject(info){
	var objs = {};
	info.id = unique();
	info.time = new Date().getTime(),
	objs[info.id] = info;
	console.log(info);
	chrome.storage.local.set(objs);
}

function removeThis(info, tab){
	var id = info.linkUrl.split('?')[1];
	chrome.storage.local.remove(id);
	chrome.tabs.sendMessage(tab.id, {
		type: "updateHighlights",
	});
}
function linkThis(info, tab){
	var id = info.linkUrl.split('?')[1];
	chrome.tabs.sendMessage(tab.id, {
		type: "openLinkDialog",
		info: {
			from: id,
		},
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
	link: {
		id: "link",
		title: "Link",
		type: "normal",
		contexts: ["link"],
		targetUrlPatterns: ["chrome-extension://" + chrome.runtime.id + "/*"],
		onclick: linkThis,
	},
	/* remove context menu at cursor */
	remove: {
		id: "remove",
		title: "Remove",
		type: "normal",
		contexts: ["link"],
		targetUrlPatterns: ["chrome-extension://" + chrome.runtime.id + "/*"],
		onclick: removeThis,
	},
};

function copy(obj){
	var r = {};
	Object.keys(obj).map(function(a){
		r[a] = obj[a];
	});
	return r;
}

chrome.contextMenus.create(menus.add);
//chrome.contextMenus.create(menus.remove);
chrome.contextMenus.create(menus.link);

function toggleMenu(event){
	if(event.type == 'mouseenter'){
	} else {
//		chrome.contextMenus.remove('remove');
//		chrome.contextMenus.remove('link');
	}
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	switch(request.type){
		case "addObject":
			addObject(request.info);
			break;
		case "menu":
			toggleMenu(request.event);
			break;
		default:
			console.log("Unknown request:", request, sender);
			break;
	}
});
