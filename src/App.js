import React, { PureComponent } from 'react';
import './App.css';
import img from "./assets/pic.png";
import MapOverlay from "./components/MapOverlay";

const google = window.google;

class App extends PureComponent {

  state = {
    map: null,
    overlay: null
  }

  componentDidMount() {
    const coords = {
      ne: new google.maps.LatLng(56.66674544466479, 9.494667291271753),
      sw: new google.maps.LatLng(56.65464577371182,
        9.481191873180933)
    };
    const overlay = { coords, img };
    const map = new google.maps.Map(document.querySelector("#map"), {
      center: { lat: 56.66674544466479, lng: 9.494667291271753 }, // lat: y, lng: x
      zoom: 15
    });
    this.setState({
      map, overlay
    });
  }


  render() {
    const { overlay } = this.state;

    return (
      <div className="App">
        <p className="App-intro">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ex, reiciendis?
        </p>
        <div id="map" style={{ height: 750, width: '100%' }} />
        {this.state.overlay && <MapOverlay url={overlay.img} coords={overlay.coords} map={this.state.map} />}
      </div>
    );
  }
}

export default App;
