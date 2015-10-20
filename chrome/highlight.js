function highlight(text){

}

function addCurrentSelection(info){
	var select = window.getSelection();
	console.log(select);
	return select;
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
	switch(request.type){
		case "addCurrentSelection":
			sendResponse(addCurrentSelection(request.info));
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
			highlight(item.text);
		});
	});
}
