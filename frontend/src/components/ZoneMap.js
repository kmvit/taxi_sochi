import React, { useEffect, useRef, useState } from 'react';

/**
 * Компонент интерактивной карты для работы с зонами
 * Использует Яндекс.Карты API для рисования и редактирования полигонов
 */
const ZoneMap = ({ zones = [], selectedZone = null, onZoneChange, editable = false }) => {
  const mapRef = useRef(null);
  const ymapRef = useRef(null);
  const polygonsRef = useRef({});
  const onZoneChangeRef = useRef(onZoneChange);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Обновляем ref при изменении onZoneChange
  useEffect(() => {
    onZoneChangeRef.current = onZoneChange;
  }, [onZoneChange]);

  // Инициализация карты
  useEffect(() => {
    if (!window.ymaps) {
      setMapError('Яндекс.Карты API не загружен. Проверьте подключение к интернету.');
      console.error('Яндекс.Карты API не загружен');
      return;
    }

    try {
      window.ymaps.ready(() => {
        try {
          if (!mapRef.current || ymapRef.current) return;

          // Создаем карту с центром на Сочи
          const map = new window.ymaps.Map(mapRef.current, {
            center: [43.5855, 39.7231], // Центр Сочи
            zoom: 11,
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl']
          });

          ymapRef.current = map;
          setIsMapReady(true);
          setMapError(null);
        } catch (error) {
          console.error('Ошибка создания карты:', error);
          setMapError('Ошибка создания карты: ' + error.message);
        }
      });
    } catch (error) {
      console.error('Ошибка инициализации Яндекс.Карт:', error);
      setMapError('Ошибка инициализации карты: ' + error.message);
    }

    return () => {
      try {
        if (ymapRef.current) {
          ymapRef.current.destroy();
          ymapRef.current = null;
        }
      } catch (error) {
        console.error('Ошибка при уничтожении карты:', error);
      }
    };
  }, []);

  // Отображение зон на карте
  useEffect(() => {
    if (!isMapReady || !ymapRef.current) return;

    const map = ymapRef.current;

    // Удаляем старые полигоны
    Object.entries(polygonsRef.current).forEach(([zoneId, polygon]) => {
      try {
        // Останавливаем редактор, если он активен
        if (polygon.editor) {
          try {
            polygon.editor.stopEditing();
          } catch (e) {
            // Игнорируем ошибки остановки редактора
          }
        }
        // Отписываемся от всех событий
        if (polygon.geometry && polygon.geometry.events) {
          polygon.geometry.events.removeAll();
        }
        if (polygon.events) {
          polygon.events.removeAll();
        }
        // Удаляем из карты
        map.geoObjects.remove(polygon);
      } catch (error) {
        // Игнорируем ошибки удаления
      }
    });
    polygonsRef.current = {};

    // Добавляем новые полигоны
    zones.forEach(zone => {
      if (!zone.geometry || !zone.geometry.coordinates || !zone.geometry.coordinates[0]) return;

      try {
        // Конвертируем GeoJSON координаты в формат Яндекс.Карт
        // GeoJSON: [lon, lat], Яндекс: [lat, lon]
        const coordinates = zone.geometry.coordinates[0].map(coord => {
          if (!coord || coord.length < 2) return [0, 0];
          return [coord[1], coord[0]];
        });

        const polygon = new window.ymaps.Polygon(
          [coordinates],
          {
            hintContent: zone.name,
            balloonContent: `<strong>${zone.name}</strong><br/>${zone.description || ''}`
          },
          {
            fillColor: zone.color || '#3b82f6',
            fillOpacity: selectedZone?.id === zone.id ? 0.5 : 0.3,
            strokeColor: zone.color || '#3b82f6',
            strokeWidth: selectedZone?.id === zone.id ? 3 : 2,
            strokeOpacity: 0.8,
            draggable: false, // Отключаем перетаскивание всего полигона
            // Опции для редактора
            editorDrawingCursor: 'crosshair',
            editorMaxPoints: 100,
            // Включаем отображение вершин при редактировании
            editorMenuManager: function (items) {
              items.push({
                title: "Удалить точку",
                onClick: function () { this.editor.stopEditing(); }
              });
              return items;
            }
          }
        );

        // Если зона выбрана и редактируемая, включаем редактор
        if (editable && selectedZone?.id === zone.id) {
          // Небольшая задержка для корректной инициализации редактора
          setTimeout(() => {
            try {
              // Проверяем, что полигон все еще существует
              if (!polygonsRef.current[zone.id] || polygonsRef.current[zone.id] !== polygon) {
                return;
              }
              
              // Запускаем редактор
              polygon.editor.startEditing();
              
              // Обработчик изменения геометрии с debounce
              let updateTimeout = null;
              const updateGeometry = () => {
                // Очищаем предыдущий таймер
                if (updateTimeout) {
                  clearTimeout(updateTimeout);
                }
                
                // Устанавливаем новый таймер с задержкой
                updateTimeout = setTimeout(() => {
                  try {
                    // Проверяем, что полигон все еще существует и в карте
                    const currentPolygon = polygonsRef.current[zone.id];
                    if (!currentPolygon || currentPolygon !== polygon) {
                      return;
                    }
                    
                    if (!polygon.geometry) return;
                    
                    const geometryCoords = polygon.geometry.getCoordinates();
                    if (!geometryCoords || !geometryCoords[0]) return;
                    const coords = geometryCoords[0];
                    if (!coords || coords.length < 3) return;
                    
                    // Конвертируем обратно в GeoJSON формат
                    const geoJsonCoords = coords.map(coord => [coord[1], coord[0]]);
                    // Замыкаем полигон
                    if (geoJsonCoords.length > 0 && 
                        (geoJsonCoords[0][0] !== geoJsonCoords[geoJsonCoords.length - 1][0] ||
                         geoJsonCoords[0][1] !== geoJsonCoords[geoJsonCoords.length - 1][1])) {
                      geoJsonCoords.push(geoJsonCoords[0]);
                    }
                    
                    if (onZoneChangeRef.current) {
                      try {
                        const bounds = polygon.geometry.getBounds();
                        if (bounds && bounds[0] && bounds[1]) {
                          onZoneChangeRef.current({
                            geometry: {
                              type: 'Polygon',
                              coordinates: [geoJsonCoords]
                            },
                            center_lat: bounds[0][0] + (bounds[1][0] - bounds[0][0]) / 2,
                            center_lon: bounds[0][1] + (bounds[1][1] - bounds[0][1]) / 2
                          });
                        }
                      } catch (boundsError) {
                        console.error('Ошибка получения границ:', boundsError);
                      }
                    }
                  } catch (error) {
                    // Игнорируем ошибки, если полигон был удален
                    if (error.message && !error.message.includes('null')) {
                      console.error('Ошибка обновления геометрии:', error);
                    }
                  }
                }, 500); // Задержка 500мс
              };
              
              // Подписываемся только на событие изменения геометрии
              if (polygon.geometry && polygon.geometry.events) {
                polygon.geometry.events.add('change', updateGeometry);
              }
            } catch (error) {
              console.error('Ошибка запуска редактора:', error);
            }
          }, 100);
        }

        map.geoObjects.add(polygon);
        polygonsRef.current[zone.id] = polygon;

        // Центрируем карту на выбранной зоне
        if (selectedZone?.id === zone.id) {
          try {
            const bounds = polygon.geometry.getBounds();
            if (bounds) {
              map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 50 });
            }
          } catch (error) {
            console.error('Ошибка центрирования карты:', error);
          }
        }
      } catch (error) {
        console.error(`Ошибка отображения зоны ${zone.name}:`, error);
      }
    });
  }, [zones, selectedZone, isMapReady, editable]);

  // Режим рисования новой зоны
  useEffect(() => {
    if (!isMapReady || !ymapRef.current || !editable || !selectedZone || selectedZone.id) return;

    const map = ymapRef.current;
    let drawingPolygon = null;

    try {
      // Создаем инструмент для рисования полигона
      drawingPolygon = new window.ymaps.Polygon(
        [[]],
        {},
        {
          fillColor: selectedZone.color || '#3b82f6',
          fillOpacity: 0.3,
          strokeColor: selectedZone.color || '#3b82f6',
          strokeWidth: 2,
          strokeOpacity: 0.8,
          editorDrawingCursor: 'crosshair',
          editorMaxPoints: 50
        }
      );

      map.geoObjects.add(drawingPolygon);
      drawingPolygon.editor.startDrawing();

      // Обработчик завершения рисования
      drawingPolygon.editor.events.add('drawingstop', () => {
        try {
          if (!drawingPolygon || !drawingPolygon.geometry) {
            if (drawingPolygon && map.geoObjects) {
              map.geoObjects.remove(drawingPolygon);
            }
            return;
          }
          const geometryCoords = drawingPolygon.geometry.getCoordinates();
          if (!geometryCoords || !geometryCoords[0]) {
            if (drawingPolygon && map.geoObjects) {
              map.geoObjects.remove(drawingPolygon);
            }
            return;
          }
          const coords = geometryCoords[0];
          if (!coords || coords.length < 3) {
            if (drawingPolygon && map.geoObjects) {
              map.geoObjects.remove(drawingPolygon);
            }
            return;
          }

          // Конвертируем в GeoJSON формат
          const geoJsonCoords = coords.map(coord => [coord[1], coord[0]]);
          geoJsonCoords.push(geoJsonCoords[0]); // Замыкаем полигон

          if (onZoneChangeRef.current) {
            try {
              const bounds = drawingPolygon.geometry.getBounds();
              if (bounds && bounds[0] && bounds[1]) {
                onZoneChangeRef.current({
                  geometry: {
                    type: 'Polygon',
                    coordinates: [geoJsonCoords]
                  },
                  center_lat: bounds[0][0] + (bounds[1][0] - bounds[0][0]) / 2,
                  center_lon: bounds[0][1] + (bounds[1][1] - bounds[0][1]) / 2
                });
              }
            } catch (error) {
              console.error('Ошибка получения границ полигона:', error);
            }
          }

          if (drawingPolygon && map.geoObjects.contains(drawingPolygon)) {
            map.geoObjects.remove(drawingPolygon);
          }
        } catch (error) {
          console.error('Ошибка при завершении рисования:', error);
        }
      });
    } catch (error) {
      console.error('Ошибка создания инструмента рисования:', error);
    }

    return () => {
      try {
        if (drawingPolygon) {
          if (drawingPolygon.editor) {
            drawingPolygon.editor.stopDrawing();
          }
          if (map && map.geoObjects) {
            map.geoObjects.remove(drawingPolygon);
          }
        }
      } catch (error) {
        // Игнорируем ошибки очистки
      }
    };
  }, [isMapReady, editable, selectedZone]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {mapError && (
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fee',
            padding: '20px',
            borderRadius: '8px',
            border: '2px solid #c00',
            zIndex: 2000,
            maxWidth: '80%',
            textAlign: 'center'
          }}
        >
          <strong style={{ color: '#c00' }}>Ошибка карты</strong>
          <p style={{ margin: '10px 0 0 0', color: '#666' }}>{mapError}</p>
        </div>
      )}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '500px',
          borderRadius: '8px'
        }}
      />
      {editable && selectedZone && !selectedZone.id && (
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1000
          }}
        >
          <strong>Нарисуйте границы зоны на карте</strong>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>
            Кликайте на карте, чтобы добавить точки полигона. Двойной клик завершит рисование.
          </p>
        </div>
      )}
      {editable && selectedZone && selectedZone.id && selectedZone.geometry && (
        <div 
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1000
          }}
        >
          <strong>Редактирование зоны</strong>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#666' }}>
            Перетаскивайте точки для изменения границ зоны
          </p>
        </div>
      )}
    </div>
  );
};

export default ZoneMap;
