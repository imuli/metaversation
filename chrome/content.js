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
	var node = document.createElement("a");
	node.id = item.id;
	node.className="metaversation";
	node.href = "metaversation:" + item.id;
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

function createDOMTree(tree){
	switch(Object.prototype.toString.call(tree)){
		case "[object Array]":
			var tag = document.createElement(tree[0]);
			Object.keys(tree[1]).map(function(attr){
				tag[attr] = tree[1][attr];
			});
			tree.slice(2).map(function(it){
				tag.appendChild(createDOMTree(it));
			});
			return tag;
			break;
		case "[object String]":
		default:
			return document.createTextNode(tree);
	}
}

function shortNodeView(node, length){
	if(length == undefined) length = 40;
	return ['a', {href: node.url, title: node.text}, node.text.slice(0,length) + (node.text.length > length ? "…" : "")];
}

function openLinkDialog(info){

	function addLink(relationship, from, to){
		chrome.runtime.sendMessage({
			type: "addObject",
			info: {
				type: 'link',
				relationship: relationship,
				from: from,
				to: to,
			},
		});
	};

	chrome.storage.local.get(null, function(items){
	var entries = Object.keys(items).map(function(key){
		return items[key];
	}).filter(function(item){
		return item.type == "node" && item.id != info.from;
	}).map(function(item){
		return ['label', {},
			['input', {type: 'checkbox', name: 'to', value: item.id}],
			shortNodeView(item),
		];
	});
	var div = createDOMTree(['div', {className: 'metaversation-linkbox'}, ['form', {},
		shortNodeView(items[info.from]),
		['input', {type: 'text', name: 'relationship', placeholder: 'relates to'}],
	].concat(entries).concat([['input', {type:'submit', value:'Link'}]])]);
	div.style.top = '1em';
	div.style.left = '1em';
	div.firstChild.addEventListener('submit', function(event){
		for(var i = 0; i < this.to.length; i++){
			if(this.to[i].checked == false) continue;
			addLink(this.relationship.value, info.from, this.to[i].value);
		}
		document.body.removeChild(div);
		event.preventDefault();
		return false;
	});
	document.body.appendChild(div);
	});
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	switch(request.type){
		case "getCurrentSelection":
			sendResponse(getCurrentSelection(request.info));
			break;
		case "updateHighlights":
			updateHighlights();
			break;
		case "openLinkDialog":
			openLinkDialog(request.info);
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
