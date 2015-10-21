function getNodeByAddress(addr){
	var a = addr.match("(.*)(>#text:nth-child[()0-9]+)");
	var p = document.querySelector(a[1]);
	if(a.length > 2){
		return p.childNodes[a[2].match("[0-9]+") - 1];
	} else {
		return p;
	}
}
function mouseEvents(event){
	chrome.runtime.sendMessage({
		type: "menu",
		event: {
			type: event.type,
			target: {
				id: event.target.id,
			},
		},
	});
}
function highlight(item){
	var range = document.createRange();
	range.setStart(getNodeByAddress(item.baseNode), item.baseOffset);
	range.setEnd(getNodeByAddress(item.extentNode), item.extentOffset);
	var node = document.createElement("div");
	node.id = item.id;
	node.className="metaversation";
	node.style.position = "absolute";
	node.style.background = "yellow";
	node.style.mixBlendMode = "darken";
	node.style.zIndex = "1";
	document.body.appendChild(node);
	node.style.top = range.getBoundingClientRect().top - document.body.getBoundingClientRect().top + "px";
	node.style.left = range.getBoundingClientRect().left - document.body.getBoundingClientRect().left + "px";
	node.style.height = range.getBoundingClientRect().height + "px";
	node.style.width = range.getBoundingClientRect().width + "px";
	node.onmouseenter = mouseEvents;
	node.onmouseleave = mouseEvents;
}
function unHighlight(node){
	document.body.removeChild(node);
}

function getChildN(node){
	var sib = node.nodeName == "#text" ? node.parentNode.childNodes : node.parentNode.children;
	for(var i = 0; i < sib.length; i++){
		if(sib[i] == node)
			return i + 1;
	}
	return 0;
}

function getNodeAddress(node){
	if(node.nodeName == "body")
		return "body";
	if(node.nodeName == "#text" || node.id == ""){
		return getNodeAddress(node.parentNode) + ">" + node.nodeName + ":nth-child(" + getChildN(node) + ")";
	}
	return "#" + node.id;
}

function getCurrentSelection(info){
	var select = window.getSelection().getRangeAt(0);
	info.baseNode = getNodeAddress(select.startContainer);
	info.baseOffset = select.startOffset;
	info.extentNode = getNodeAddress(select.endContainer); 
	info.extentOffset = select.endOffset;
	return info;
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	switch(request.type){
		case "getCurrentSelection":
			sendResponse(getCurrentSelection(request.info));
			break;
		case "updateHighlights":
			updateHighlights();
			break;
		default:
			console.log("Unknown request:", request, sender);
			break;
	}
});

function updateHighlights(){
	chrome.storage.local.get(null, function(items){
		Object.keys(items).map(function(key){
			return items[key];
		}).filter(function(item){
			return item.url == document.location;
		}).map(function(item){
			if(document.getElementById(item.id) == undefined){
				highlight(item);
			}
			return item;
		});
		var highlighted = document.querySelectorAll(".metaversation");
		for(var i = 0; i < highlighted.length; i++){
			if(items[highlighted[i].id] == undefined){
				unHighlight(highlighted[i]);
			}
		}
	});
}

updateHighlights();
