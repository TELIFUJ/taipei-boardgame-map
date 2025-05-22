var appView = new ol.View({
  center: ol.proj.fromLonLat([121.5654, 25.0330]), // 台北市中心
  zoom: 13
});

// 桌遊 icon 樣式
const storeStyle = new ol.style.Style({
  image: new ol.style.Icon({
    anchor: [0.5, 1],
    src: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' // 可改為你自己的圖示
  })
});

const storeSource = new ol.source.Vector();
const storeLayer = new ol.layer.Vector({
  source: storeSource,
  title: '桌遊店'
});

const baseLayer = new ol.layer.Tile({
  source: new ol.source.WMTS({
    matrixSet: 'EPSG:3857',
    format: 'image/png',
    url: 'https://wmts.nlsc.gov.tw/wmts',
    layer: 'EMAP',
    tileGrid: new ol.tilegrid.WMTS({
      origin: ol.extent.getTopLeft(ol.proj.get('EPSG:3857').getExtent()),
      resolutions: Array.from({ length: 20 }, (_, z) => 40075016.68557849 / 256 / Math.pow(2, z)),
      matrixIds: Array.from({ length: 20 }, (_, z) => z)
    }),
    style: 'default',
    wrapX: true
  }),
  opacity: 0.9
});

const map = new ol.Map({
  target: 'map',
  layers: [baseLayer, storeLayer],
  view: appView
});

// MRT Stations
const mrtStationStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 4,
    fill: new ol.style.Fill({ color: '#007bff' }),
    stroke: new ol.style.Stroke({ color: '#fff', width: 1 })
  })
});
const mrtStationLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/mrt_stations.json',
    format: new ol.format.GeoJSON()
  }),
  style: mrtStationStyle,
  title: 'MRT Stations'
});
map.addLayer(mrtStationLayer);

// MRT Routes
const mrtRouteLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/mrt_routes.geojson',
    format: new ol.format.GeoJSON()
  }),
  style: feature => new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#ff1493',
      width: 3
    })
  }),
  title: 'MRT Routes'
});
map.addLayer(mrtRouteLayer);

// 載入桌遊店資料
$.getJSON('data/stores.json', function (stores) {
  stores.forEach(function (d) {
    const feature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([d.lng, d.lat])),
      name: d.name,
      pricing: d.pricing,
      services: d.services.join('、'),
      district: d.district
    });
    feature.setStyle(storeStyle); // ✅ 必須給每個點樣式，才能顯示並響應點擊
    storeSource.addFeature(feature);
  });
});

// Popup 設定
const container = document.getElementById('popup');
const content = document.getElementById('popup-content');
const overlay = new ol.Overlay({
  element: container,
  autoPan: true,
  positioning: 'bottom-center',
  stopEvent: false,
  offset: [0, -10]
});
map.addOverlay(overlay);

// 點擊顯示資訊
map.on('singleclick', function (evt) {
  let found = false;
  map.forEachFeatureAtPixel(evt.pixel, function (feature) {
    const props = feature.getProperties();
    if (!props.name) return; // 如果沒有 name，就不是桌遊店
    const coord = feature.getGeometry().getCoordinates();
    const html = `
      <h3>${props.name}</h3>
      <b>計費：</b>${props.pricing}<br>
      <b>服務：</b>${props.services}<br>
      <b>行政區：</b>${props.district}<br>
    `;
    content.innerHTML = html;
    overlay.setPosition(coord);
    found = true;
  });

  // 如果點到空白處，就關掉 popup
  if (!found) {
    overlay.setPosition(undefined);
  }
});