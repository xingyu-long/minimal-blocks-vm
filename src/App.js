import React, { useContext, useEffect, useRef } from "react";
import "./App.css";
import ScratchBlocks from "scratch-blocks";
import ScratchStorage from "scratch-storage";
import ScratchRender from "scratch-render";
import ScratchSVGRenderer from "scratch-svg-renderer";
import AudioEngine from "scratch-audio";
import ScratchVM from "scratch-vm";

const workspaceConfig = {
  media: "/media/",
  zoom: {
    controls: true,
    wheel: true,
    startScale: 0.6,
  },
  colours: {
    workspace: "#334771",
    flyout: "#283856",
    scrollbar: "#24324D",
    scrollbarHover: "#0C111A",
    insertionMarker: "#FFFFFF",
    insertionMarkerOpacity: 0.3,
    fieldShadow: "rgba(255, 255, 255, 0.3)",
    dragShadowOpacity: 0.6,
  },
  toolbox: '<xml id="toolbox" style="display: none"></xml>',
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
      workspace.current.getFlyout().hide();
    }
    if (canvas.current) {
      if (!vm.current) {
        vm.current = getScratchVM(canvas.current);
        vm.current.addListener("workspaceUpdate", updateWorkspaceFunc);
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
        .then(() => {});
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
    </div>
  );
}

export default App;
