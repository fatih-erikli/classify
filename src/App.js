import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

const LABELS_ENDPOINT = "http://localhost:8080/labels";
const TRAIN_ENDPOINT = "http://localhost:8080/train";
const CLASSIFICATION_ENDPOINT = "http://localhost:8080/classify";

const TEXT_CLASSIFICATION = "text";
const IMAGE_CLASSIFICATION = "image";
const CLASSIFICATION_TYPES = [TEXT_CLASSIFICATION, IMAGE_CLASSIFICATION];

const options = [
  { value: "chocolate", label: "Chocolate" },
  { value: "strawberry", label: "Strawberry" },
  { value: "vanilla", label: "Vanilla" },
];

function StatisticsView() {
  return <span>stats</span>;
}
function TrainView() {
  const [text, setText] = useState("");
  const [selectedType, setSelectedType] = useState(TEXT_CLASSIFICATION);
  const [labels, setLabels] = useState([]);
  const [labelsLoading, setLabelsLoading] = useState(true);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const currentLabel = selectedLabel || { label: labels[0], value: 0 };
  useEffect(() => {
    if (labelsLoading) {
      fetch(LABELS_ENDPOINT)
        .then((response) => response.json())
        .then((response) => {
          setLabels(response.labels);
          setLabelsLoading(false);
        });
    }
  }, [labelsLoading]);
  const train = (event) => {
    fetch(TRAIN_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        label: currentLabel["label"],
      }),
    }).then(() => {
      setText("");
    });
  };
  const onTextChange = (event) => {
    setText(event.target.value);
  };
  const onLabelChange = (label) => {
    setSelectedLabel(label);
  };
  return (
    <>
      <CreatableSelect
        value={!labelsLoading && currentLabel}
        onChange={onLabelChange}
        options={labels.map((label, index) => ({
          value: index,
          label,
        }))}
      />
      <label>Material type</label>
      {CLASSIFICATION_TYPES.map((type, index) => (
        <label>
          <input
            onChange={() => setSelectedType(type)}
            checked={type === selectedType}
            type={"radio"}
            value={index}
          />{" "}
          {type}
        </label>
      ))}
      {selectedType === TEXT_CLASSIFICATION && (
        <>
          <label>Training text</label>
          <textarea
            value={text}
            onChange={onTextChange}
            className={"text"}
          ></textarea>
        </>
      )}
      {selectedType === IMAGE_CLASSIFICATION && (
        <>
          <label>Image</label>
          <input type={"file"} />
        </>
      )}
      <div className={"buttons"}>
        <button onClick={train}>Train</button>
      </div>
    </>
  );
}

function ClassifyView() {
  const [text, setText] = useState("");
  const [labels, setLabels] = useState([]);
  const [scores, setScores] = useState({});
  const onTextChange = (event) => {
    setText(event.target.value);
  };
  const classify = (event) => {
    fetch(CLASSIFICATION_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })
      .then((response) => {
        return response.json();
      })
      .then(({ labels, scores }) => {
        setLabels(labels);
        setScores(scores);
      });
  };
  return (
    <>
      <label>Text</label>
      <textarea
        value={text}
        onChange={onTextChange}
        className={"text"}
      ></textarea>
      <div className={"buttons"}>
        <button onClick={classify}>Classify</button>
      </div>
      {labels.map((label) => (
        <div className={"classification-result"}>
          <span className={"classification-result-label"}>{label}</span>
          <span className={"classification-result-score"}>{scores[label]}</span>
        </div>
      ))}
    </>
  );
}
function NetworksView() {}
function FeaturesView() {}

const NAVIGATION = [
  ["Statistics", StatisticsView],
  ["Train", TrainView],
  ["Classify", ClassifyView],
  ["Networks", NetworksView],
  ["Features", FeaturesView],
];

function App() {
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [currentViewLabel, View] = NAVIGATION[currentViewIndex];

  const onClickNavigationItem = (index) => (event) => {
    setCurrentViewIndex(index);
    event.preventDefault();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Classify</h1>
      </header>
      <nav>
        {NAVIGATION.map(([label, view], index) => (
          <li className={currentViewIndex === index && "active"}>
            <a
              onClick={onClickNavigationItem(index)}
              href={`#${label.toLowerCase()}`}
            >
              {label}
            </a>
          </li>
        ))}
      </nav>
      <section>
        <h3>{currentViewLabel}</h3>
        <div className="content">
          <View />
        </div>
      </section>
      <footer>Copyright, 2021, Classify project. Fatih Erikli.</footer>
    </div>
  );
}

export default App;
