function loadPage(url){
// Write a function that return the next structure
// with the URLs replaced in the load nodes.

    dhtmlHistory.add(url, 1);
    window.url = url;

    // Start the loading indacator for
    // the user.

    window.nextUrlList_array = [];
    window.nextTemplate_xml = page.test1();

    // Retrieve all the URLs of a template and put them in
    // an associative array.
    processTemplateStructure(window.nextTemplate_xml, 'next');
    loadBlocks();
}

function loadBlocks(){
    window.urlsToLoad_array = [];
    for(var i=0;i<window.nextUrlList_array.length;i++){
        if(window.actualUrlList_array[window.nextUrlList_array[i][1]] != null && isNaN(window.nextUrlList_array[i][1])){
            // Get the content of the blocks which
            // are already loaded in the page and
            // save it in the array which will be used
            // to show in next page.
            window.nextUrlList_array[i][1] = document.getElementById(window.actualUrlList_array[window.nextUrlList_array[i][1]]).innerHTML;
        }else{
            // Set a list of URLs in an array. And start
            // the loading asynchronously with an AJAX request.
            // The array contains the URL to load and the index
            // position in the other array (nextUrlList_array).
            if(!isNaN(window.nextUrlList_array[i][1])){
                // Update the URL (which is actually
                // an Int) in the next XML template.
                mergedUrl = urlMerge(window.urlList_array[window.nextUrlList_array[i][1]], window.url);
                window.nextTemplate_xml.getElementsByTagName(window.nextUrlList_array[i][0])[0].firstChild.firstChild.nodeValue = mergedUrl;
                window.nextUrlList_array[i][1] = mergedUrl;
            }
            window.urlsToLoad_array[window.urlsToLoad_array.length] = [i, window.nextUrlList_array[i][1]];
            new Ajax.Request( window.nextUrlList_array[i][1], { method: 'get', onComplete: loadUrlInArray });
        }
    }
}

function urlMerge(urlFromTemplate, requestedUrl){
        return urlFromTemplate + '?' + requestedUrl;
}

function returnStructure(template){
    // Return the structure depending of
    // it's type.
    structure_xml = xmlDOM(template);
    if(structure_xml.firstChild.firstChild.nodeName == 'template'){
        window.urlList_array = [];
        for(var i=0;i<structure_xml.firstChild.childNodes[1].childNodes.length;i++){
            // Put the URLs to load in an array.
            window.urlList_array[i] = structure_xml.firstChild.childNodes[1].childNodes[i].firstChild.nodeValue;
        }
        // Return the structure.
        return eval('window.template.'+structure_xml.firstChild.firstChild.firstChild.nodeValue+'()');
    }else{
        return structure_xml;
    }
}

function loadUrlInArray(response){
    for(var i=0;i<window.urlsToLoad_array.length;i++){
        if(window.urlsToLoad_array[i][1] == response.url){
            // Delete that URL from the array
            // because he just got loaded.
            window.nextUrlList_array[window.urlsToLoad_array[i][0]][1] = response.responseText;
            window.urlsToLoad_array.splice(i,1);
        }
    }

    // All the blocks has been loaded and it's now
    // time to change the content displayed to the user.
    if(window.urlsToLoad_array.length == 0){
        compare2Structures(window.actualTemplate_xml.firstChild.firstChild, window.nextTemplate_xml.firstChild.firstChild);
    }
}

function processTemplateStructure(childs_xml, action){
    // Process the nodes "childs" of this node.
    for(var i=0;i<childs_xml.childNodes.length;i++){
        for(var j=0;j<childs_xml.childNodes[i].childNodes.length;j++){
            if(childs_xml.childNodes[i].childNodes[j].nodeName == 'childs'){
                processTemplateStructure(childs_xml.childNodes[i].childNodes[j], action);
            }

            if(childs_xml.childNodes[i].childNodes[j].nodeName == 'load' && action == 'actual'){
                window.actualUrlList_array[childs_xml.childNodes[i].childNodes[j].firstChild.nodeValue] = childs_xml.childNodes[i].nodeName;
            }else if(childs_xml.childNodes[i].childNodes[j].nodeName == 'load' && action == 'next'){
                window.nextUrlList_array[window.nextUrlList_array.length] = [childs_xml.childNodes[i].nodeName, childs_xml.childNodes[i].childNodes[j].firstChild.nodeValue];
            }
        }
    }
}

function compare2Structures(actual_xml, next_xml){
    // Delete the HTML elements that are not in
    // the new template.
    if(Try.these(function() {return actual_xml.childNodes.length > next_xml.childNodes.length;})){
        // Get the actual name tag and replace the last
        // part with the blocks numbers to delete.
        nameTags_array = next_xml.childNodes[0].nodeName.split('_');

        // Delete the blocks.
        for(var k=0;k<(actual_xml.childNodes.length-next_xml.childNodes.length);k++){
            nameTags_array[nameTags_array.length-1] = (nameTags_array[nameTags_array.length-1].substr(0,1)) + (actual_xml.childNodes.length-(actual_xml.childNodes.length-next_xml.childNodes.length)+k);
            Element.remove($(nameTags_array.join('_')));
        }
    }

    // Clean the blocks from their previous content if
    // they have no childs anymore. 
    blockToClean_array = next_xml.childNodes[0].nodeName.split('_')
    blockToClean_array = blockToClean_array.slice(0,blockToClean_array.length-1);
    if(Try.these(function() {return actual_xml.childNodes[0].childNodes[0] == undefined;})){
        Try.these(function() {$(blockToClean_array.join('_')).innerHTML = '';});
    }

    // Process the nodes "childs" of this node.
    for(var i=0;i<next_xml.childNodes.length;i++){

        for(var j=0;j<next_xml.childNodes[i].childNodes.length;j++){
                // Verify if the actual structure has childs
                // at that stage of the loading of the new structure.
                // This is done with a "Try" to avoid errors and
                // crash the process.
                nextChildsStatus = Try.these(function() {return next_xml.childNodes[i].childNodes[j].nodeName == 'childs';});

                if(nextChildsStatus){
                    // Create the block if it doesn't exists.
                    if($(next_xml.childNodes[i].nodeName) == null){
                        new Insertion.Bottom(blockToClean_array.join('_'), '<div id="' + next_xml.childNodes[i].nodeName + '"></div>');
                    }

                    if(Try.these(function() {return actual_xml.childNodes[i].childNodes[j];}) == undefined){
                        actualTree_xml = '';
                    }else{
                        actualTree_xml = actual_xml.childNodes[i].childNodes[j];
                    }
                    compare2Structures(actualTree_xml, next_xml.childNodes[i].childNodes[j]);
                }else{
                    if(next_xml.childNodes[i].childNodes[j].nodeName == 'load'){
                        // This node has content to load.
                        for(var c=0;c<window.nextUrlList_array.length;c++){
                            if(window.nextUrlList_array[c][0] == next_xml.childNodes[i].nodeName){
                                var nextBlockContent = window.nextUrlList_array[c][1];
                            }
                        }

                        if(Try.these(function() {return actual_xml.childNodes[i].childNodes[j].hasChildNodes() == true;}) != undefined){
                            // Replace the content of the already
                            // existing block if the value of the node
                            // is an URL.
                            if(document.getElementById(actual_xml.childNodes[i].nodeName).innerHTML != nextBlockContent){
                                $(next_xml.childNodes[i].nodeName).innerHTML = nextBlockContent;
                            }
                        }else{
                            // Build the block and insert the content
                            // at the end of the parent.
                            new Insertion.Bottom(blockToClean_array.join('_'), '<div id="' + next_xml.childNodes[i].nodeName + '">' + nextBlockContent + '</div>');
                        }
                    }
                }

                // Set the style of this block.
                if(next_xml.childNodes[i].childNodes[j].nodeName == 'style'){
                    Element.setStyle(next_xml.childNodes[i].nodeName, next_xml.childNodes[i].childNodes[j].firstChild.nodeValue);
                }
        }
    }
    window.actualTemplate_xml = window.nextTemplate_xml;
    processTemplateStructure(window.actualTemplate_xml, 'actual');
}
