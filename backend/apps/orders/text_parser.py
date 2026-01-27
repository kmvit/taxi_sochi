"""
Парсер текста заказа для администратора
"""
import re
from datetime import datetime
from typing import Dict, Optional, Tuple


class TextOrderParser:
    """
    Парсер для обработки текста заказа в определенном формате
    """
    
    def __init__(self):
        self.patterns = {
            'passengers': re.compile(r'Пассажиры:\s*(.+?)(?=\n|Примечание:|Откуда:|$)', re.IGNORECASE | re.DOTALL),
            'comment': re.compile(r'Примечание:\s*(.+?)(?=\nОткуда:|$)', re.IGNORECASE | re.DOTALL),
            'address_from': re.compile(r'Откуда:\s*(.+?)(?=\nКуда:|$)', re.IGNORECASE | re.DOTALL),
            'address_to': re.compile(r'Куда:\s*(.+?)(?=\nВремя подачи:|$)', re.IGNORECASE | re.DOTALL),
            'pickup_time': re.compile(r'Время подачи:\s*(.+?)(?=\nНаправление:|$)', re.IGNORECASE | re.DOTALL),
            'direction': re.compile(r'Направление:\s*(.+?)(?=\nКласс автомобиля:|$)', re.IGNORECASE | re.DOTALL),
            'car_class': re.compile(r'Класс автомобиля:\s*(.+?)(?=\nКоличество пассажиров:|$)', re.IGNORECASE | re.DOTALL),
            'passenger_count': re.compile(r'Количество пассажиров:\s*(\d+)', re.IGNORECASE),
            'flight_number': re.compile(r'Авиарейс:\s*(.+?)(?=\nВремя отбытия|$)', re.IGNORECASE | re.DOTALL),
            'flight_departure_time': re.compile(r'Время отбытия самолёта:\s*(.+?)(?=\n|$)', re.IGNORECASE | re.DOTALL),
        }
    
    def parse(self, text: str) -> Dict:
        """
        Парсит текст заказа и извлекает данные
        
        Args:
            text (str): Текст заказа
            
        Returns:
            dict: Распарсенные данные заказа
        """
        if not text or not text.strip():
            raise ValueError("Текст заказа пуст")
        
        result = {}
        
        # Парсим пассажиров (ФИО и телефоны)
        passengers_match = self.patterns['passengers'].search(text)
        if passengers_match:
            passengers_text = passengers_match.group(1).strip()
            # Извлекаем ФИО и телефоны
            # Формат: ФИО телефон1 телефон2 ...
            phone_pattern = r'(\+?\d{10,15})'
            phones = re.findall(phone_pattern, passengers_text)
            
            # Убираем телефоны из текста, чтобы получить ФИО
            passenger_name = re.sub(phone_pattern, '', passengers_text).strip()
            # Убираем лишние пробелы
            passenger_name = re.sub(r'\s+', ' ', passenger_name).strip()
            
            result['passenger_name'] = passenger_name if passenger_name else None
            # Берем только первый телефон
            result['passenger_phone'] = phones[0] if phones else None
        else:
            result['passenger_name'] = None
            result['passenger_phone'] = None
        
        # Парсим примечание
        comment_match = self.patterns['comment'].search(text)
        if comment_match:
            result['comment'] = comment_match.group(1).strip()
        else:
            result['comment'] = ''
        
        # Парсим адреса
        address_from_match = self.patterns['address_from'].search(text)
        if address_from_match:
            result['address_from'] = address_from_match.group(1).strip()
        else:
            result['address_from'] = None
        
        address_to_match = self.patterns['address_to'].search(text)
        if address_to_match:
            result['address_to'] = address_to_match.group(1).strip()
        else:
            result['address_to'] = None
        
        # Парсим время подачи
        pickup_time_match = self.patterns['pickup_time'].search(text)
        if pickup_time_match:
            time_str = pickup_time_match.group(1).strip()
            try:
                # Формат: 24.11.2025, 09:30
                result['pickup_time'] = self._parse_datetime(time_str)
            except ValueError as e:
                raise ValueError(f"Неверный формат времени подачи: {time_str}. Ожидается формат: ДД.ММ.ГГГГ, ЧЧ:ММ")
        else:
            result['pickup_time'] = None
        
        # Парсим направление
        direction_match = self.patterns['direction'].search(text)
        if direction_match:
            direction_text = direction_match.group(1).strip().lower()
            if 'туда и обратно' in direction_text or 'обратно' in direction_text:
                result['direction'] = 'roundtrip'
            else:
                result['direction'] = 'oneway'
        else:
            result['direction'] = 'oneway'  # По умолчанию
        
        # Парсим класс автомобиля
        car_class_match = self.patterns['car_class'].search(text)
        if car_class_match:
            result['car_class'] = car_class_match.group(1).strip()
        else:
            result['car_class'] = None
        
        # Парсим количество пассажиров
        passenger_count_match = self.patterns['passenger_count'].search(text)
        if passenger_count_match:
            result['passenger_count'] = int(passenger_count_match.group(1))
        else:
            result['passenger_count'] = 1  # По умолчанию
        
        # Парсим номер рейса
        flight_number_match = self.patterns['flight_number'].search(text)
        if flight_number_match:
            result['flight_number'] = flight_number_match.group(1).strip()
        else:
            result['flight_number'] = ''
        
        # Парсим время отбытия самолёта и добавляем в комментарий
        flight_departure_match = self.patterns['flight_departure_time'].search(text)
        if flight_departure_match:
            departure_time = flight_departure_match.group(1).strip()
            if result['comment']:
                result['comment'] += f"\nВремя отбытия самолёта: {departure_time}"
            else:
                result['comment'] = f"Время отбытия самолёта: {departure_time}"
        
        return result
    
    def _parse_datetime(self, time_str: str) -> datetime:
        """
        Парсит строку даты и времени в формате ДД.ММ.ГГГГ, ЧЧ:ММ
        
        Args:
            time_str (str): Строка с датой и временем
            
        Returns:
            datetime: Объект datetime
        """
        # Убираем лишние пробелы
        time_str = time_str.strip()
        
        # Формат: 24.11.2025, 09:30
        # Может быть с запятой или без
        pattern = r'(\d{1,2})\.(\d{1,2})\.(\d{4})\s*,?\s*(\d{1,2}):(\d{2})'
        match = re.match(pattern, time_str)
        
        if not match:
            raise ValueError(f"Неверный формат даты: {time_str}")
        
        day, month, year, hour, minute = map(int, match.groups())
        
        try:
            return datetime(year, month, day, hour, minute)
        except ValueError as e:
            raise ValueError(f"Неверная дата: {e}")
    
    def validate_required_fields(self, parsed_data: Dict) -> Tuple[bool, list]:
        """
        Проверяет наличие обязательных полей
        
        Args:
            parsed_data (dict): Распарсенные данные
            
        Returns:
            tuple: (is_valid, missing_fields)
        """
        required_fields = [
            ('passenger_name', 'ФИО пассажира'),
            ('passenger_phone', 'Телефон пассажира'),
            ('address_from', 'Адрес откуда'),
            ('address_to', 'Адрес куда'),
            ('pickup_time', 'Время подачи'),
            ('car_class', 'Класс автомобиля'),
        ]
        
        missing = []
        for field, label in required_fields:
            if not parsed_data.get(field):
                missing.append(label)
        
        return len(missing) == 0, missing
