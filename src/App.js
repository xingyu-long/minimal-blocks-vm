import React, { useContext, useEffect, useRef } from "react";
import "./App.css";
import ScratchBlocks from "scratch-blocks";
import ScratchStorage from "scratch-storage";
import ScratchRender from "scratch-render";
import ScratchSVGRenderer from "scratch-svg-renderer";
import AudioEngine from "scratch-audio";
import ScratchVM from "scratch-vm";
import axios from "axios";

const workspaceConfig = {
  media: "/media/",
  zoom: {
    controls: true,
    wheel: true,
    startScale: 0.6,
  },
  colours: {
    workspace: "#f9f9f9",
    flyout: "#283856",
    scrollbar: "#24324D",
    scrollbarHover: "#0C111A",
    insertionMarker: "#FFFFFF",
    insertionMarkerOpacity: 0.3,
    fieldShadow: "rgba(255, 255, 255, 0.3)",
    dragShadowOpacity: 0.6,
  },
  // toolbox: '<xml id="toolbox" style="display: none"></xml>',
};

function getScratchVM(canvas) {
  const storage = new ScratchStorage();
  const renderer = new ScratchRender(canvas);
  const audioEngine = new AudioEngine();
  const SVGAdapter = new ScratchSVGRenderer.SVGRenderer();
  const bitmapAdapter = new ScratchSVGRenderer.BitmapAdapter();

  const vm = new ScratchVM();
  vm.attachRenderer(renderer);
  vm.attachAudioEngine(audioEngine);
  vm.attachStorage(storage);
  vm.attachV2SVGAdapter(SVGAdapter);
  vm.attachV2BitmapAdapter(bitmapAdapter);
  vm.runtime.setCompatibilityMode(true);
  return vm;
}

// Generate puzzle based on all blocks in XML textarea.
function generatePuzzle(workspace) {
  var input = document.getElementById('importExport');
  var xml = ScratchBlocks.Xml.textToDom(input.value);
  var strs = getBlocksWithLevel(xml);

  var text = "<xml xmlns=\"http://www.w3.org/1999/xhtml\">\n";
  // "  <variables></variables>";
  for (let i = 0; i < strs.length; i++) {
    text += strs[i];
  }
  text += "</xml>";

  // clear current workspace and place the random one;
  workspace.clear();
  var sample_xml = ScratchBlocks.Xml.textToDom(text);
  ScratchBlocks.Xml.domToWorkspace(sample_xml, workspace);
  // taChange();
}

// Get all blocks.
function getBlocksWithLevel(xml) {
  var block_list = [];
  var queue = [];
  var row = 1, col = 1;

  for (let i = 0; i < xml.children.length; i++) {
    let curr = xml.children[i];
    if (curr.tagName === 'block' || curr.tagName === 'variables') {
      queue.push(curr);
    }
  }

  // Use BFS to iterate each block and find inside block.
  while (queue.length !== 0) {
    var curr = queue.shift();
    block_list.push(curr); // Add block each time.
    for (let i = 0; i < curr.children.length; i++) {
      let child = curr.children[i];
      // We can get the inside <block> in <next>.
      if (child.tagName === 'next') {
        let insideBlock = child.getElementsByTagName('block')[0];
        queue.push(insideBlock);
      } else if (child.tagName === 'statement') {
        // will not go to next level;
        break;
      }
    }
  }

  // Randomize blocks.
  for (let i = block_list.length - 1; i > 0; i--) {
    let index = Math.floor(Math.random() * i) + 1;
    // console.log("index = " + index);
    let temp = block_list[i];
    block_list[i] = block_list[index];
    block_list[index] = temp;
  }
  console.log(block_list);

  // let colNum = block_list.length / 2;
  var strs = [];

  // Remove the <next> tag in <block>
  for (let i = 0; i < block_list.length; i++) {
    let block = block_list[i];
    if (block.getElementsByTagName('next').length === 0 || hasStatement(block)) {
      setBlockPosition(block, row, col);
      strs.push(block.outerHTML);
    } else {
      let child = block.children;
      let next = null;
      for (let j = 0; j < child.length; j++) {
        if (child[j].tagName === 'next') {
          next = child[j];
        }
      }
      block.removeChild(next);
      setBlockPosition(block, row, col);
      strs.push(block.outerHTML);
    }
    col++;
    // Uncomment if you need to set a fixed colNum.
    // if (col > colNum) {
    //   col = 1;
    //   row++;
    // }w
  }
  return strs;
}


// Set position of block via adding or editing x and y value.
function setBlockPosition(block, row, col) {
  if (block.hasAttribute("x") && block.hasAttribute("y")) {
    block.getAttributeNode("x").nodeValue = String(row * 150);
    block.getAttributeNode("y").nodeValue = String(col * 150);
  } else {
    block.setAttribute("x", String(row * 150));
    block.setAttribute("y", String(col * 150));
  }
}

function hasStatement(block) {
  for (let i = 0; i < block.children.length; i++) {
    if (block.children[i].tagName === 'statement') return true;
  }
  return false;
}

// Check if two DOM are equal.
function isValidateSequence(workspace) {
  var input = document.getElementById('importExport');
  var inputXml = ScratchBlocks.Xml.textToDom(input.value);
  var workspaceXml = ScratchBlocks.Xml.workspaceToDom(workspace);
  let isSame = DFS(inputXml, workspaceXml);
  if (isSame) {
    console.log("True");
  } else {
    console.log("False");
  }
}

// Iterate all the child and check the necessary attributes.
function DFS(input, workspace) {
  if (input.children.length !== workspace.children.length) {
    // console.log("Length error in " + input + " workspace = " + workspace);
    return false;
  }
  if (input.tagName.toLowerCase() !== workspace.tagName.toLowerCase()) {
    // console.log("Tag error in " + input.tagName + " workspace = " + workspace.tagName);
    return false;
  }
  if (input.tagName.toLowerCase() === 'block') {
    // console.log("Hi, it's in Block");
    if (input.getAttributeNode("id").nodeValue !== workspace.getAttributeNode("id").nodeValue) {
      return false;
    }
    if (input.getAttributeNode("type").nodeValue !== workspace.getAttributeNode("type").nodeValue) {
      return false;
    }
  }

  let n = input.children.length;
  for (let i = 0; i < n; i++) {
    if (!DFS(input.children[i], workspace.children[i])) {
      return false;
    }
  }
  return true;
}

function toXML(workspace) {
  var output = document.getElementById('importExport');
  const dom = ScratchBlocks.Xml.workspaceToDom(workspace);
  const text = ScratchBlocks.Xml.domToPrettyText(dom);
  output.value = text;
  output.focus();
  output.select();
  taChange();
}

function fromXML(workspace) {
  const input = document.getElementById('importExport');
  const xml = ScratchBlocks.Xml.textToDom(input.value);
  ScratchBlocks.Xml.clearWorkspaceAndLoadFromXml(xml, workspace);
  taChange();
}

// Seems not working.
function taChange() {
  var textarea = document.getElementById('importExport');
  if (sessionStorage) {
    sessionStorage.setItem('textarea', textarea.value)
  }
  var valid = true;
  try {
    ScratchBlocks.Xml.textToDom(textarea.value);
  } catch (e) {
    valid = false;
  }
  document.getElementById('import').disabled = !valid;
}

function getBlockById(workspace, blockIds) {
  //  API call for backend.
  var xml_list = [];
  for (let i = 0; i < blockIds.length; i++) {
    var blockId = blockIds[i];
    var found = workspace.getBlockById(blockId)
    // console(found)
    var dom = ScratchBlocks.Xml.blockToDom(found);
    xml_list.push(ScratchBlocks.Xml.domToPrettyText(dom));
  }
  console.log(xml_list);
}

function findPattern(workspace, json_data) {
  const data = {
    block_json: json_data
  }

  axios.post('http://localhost:1234/api/pattern', data)
    .then((res) => {
      // TODO:optimize the data we are passing.
      // project_file in backend, pass the filename
      // TODO: need id from front-end.
      console.log('Status: ' + res.status);
      console.log('Body: ' + JSON.stringify(res.data));
      json_data = res.data.pattern;
      var blockIds = []
      for (var key in json_data) {
        console.log("key = " + key);
        console.log(json_data[key]);
        for (let i = 0; i < json_data[key].length; i++) {
          blockIds.push(json_data[key][i]);
        }
      }
      getBlockById(workspace, blockIds);
      workspace.highlightCode({
        startId: blockIds[0],
        endId: blockIds[blockIds.length - 1]
      }, true);
    }).catch((err) => {
      console.error(err)
    })
}

function App() {
  const blocksDom = useRef(null);
  const workspace = useRef(null);
  const canvas = useRef(null);
  const vm = useRef(null);
  const targetSelectBoxRef = useRef(null);

  const onSelectTarget = () => {
    if (vm.current.editingTarget.id !== targetSelectBoxRef.current.value) {
      vm.current.setEditingTarget(targetSelectBoxRef.current.value);
    }
  };

  useEffect(() => {
    const updateWorkspaceFunc = (data) => {
      const dom = ScratchBlocks.Xml.textToDom(data.xml);
      ScratchBlocks.Xml.clearWorkspaceAndLoadFromXml(dom, workspace.current);
    };
    if (!workspace.current) {
      workspace.current = ScratchBlocks.inject("blocks", workspaceConfig);
      // workspace.current.getFlyout().hide();
    }
    if (canvas.current) {
      if (!vm.current) {
        vm.current = getScratchVM(canvas.current);
        vm.current.addListener("workspaceUpdate", updateWorkspaceFunc);
        workspace.current.addChangeListener(data => {
          vm.current.blockListener(data);
        });
        vm.current.runtime.on("TARGETS_UPDATE", () => {
          if (targetSelectBoxRef.current.options.length === 0) {
            //if not populated yet
            vm.current.runtime.targets.forEach((t) => {
              let opt = document.createElement("option");
              opt.value = t.id;
              opt.innerHTML = t.sprite.name;
              if (t.id === vm.current.editingTarget.id) {
                opt.selected = true;
              }
              targetSelectBoxRef.current.appendChild(opt);
            });
          }
        });
      }

      const projectId = window.location.hash.split("#")[1];
      fetch(`http://localhost:3001/download/projects/${projectId}.sb3`, {
        mode: "cors",
      })
        .then((response) => response.arrayBuffer())
        .then((project) => {
          vm.current.loadProject(project);
        })
        .then(() => {
          vm.current.start();
        })
        .then(() => { });
    }

    return () => {
      vm.current.removeListener("workspaceUpdate", updateWorkspaceFunc);
    };
  }, []);
  return (
    <div className="App">
      <div id="blocks" ref={blocksDom} className="blocks"></div>
      <div className="control">
        <button onClick={() => vm.current.greenFlag()}>Green Flag</button>
        <button onClick={() => vm.current.stopAll()}>Stop All</button>
        <button onClick={() => console.log(vm.current.toJSON())}>
          Log (json)
        </button>
        <button onClick={() => toXML(workspace.current)}>Export to XML</button>
        <button id="import" onClick={() => fromXML(workspace.current)}>Import from XML</button>
        <button onClick={() => generatePuzzle(workspace.current)}>Generate Puzzle</button>
        <button onClick={() => isValidateSequence(workspace.current)}>Check sequences</button>
        <button onClick={() => findPattern(workspace.current, vm.current.toJSON())}>Log (found pattern)</button>

      </div>
      <div className="targetSelector">
        <select
          name="sometext"
          size="8"
          ref={targetSelectBoxRef}
          onChange={onSelectTarget}
        ></select>
      </div>
      <canvas ref={canvas} className="stage" />
      <textarea id="importExport"
        className="importExport"
        onChange={() => taChange()}
        onKeyUp={() => taChange()}></textarea>
    </div>
  );
}

export default App;
