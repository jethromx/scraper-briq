# Notificador de Campañas Activas

Este proyecto es un script que valida campañas activas y notifica a través de Telegram y Slack sobre nuevas campañas disponibles que cumplan ciertos criterios.

## Características

- Filtra campañas activas basadas en su fecha objetivo y tipo.
- Notifica campañas nuevas a través de:
  - Telegram.
  - Slack (usando un webhook).
- Evita notificar campañas duplicadas mediante un archivo de registro.

## Requisitos

- Node.js (versión 14 o superior).
- Dependencias del proyecto (ver sección de instalación).

## Instalación

1. Clona este repositorio:  
   ```bash
   git clone https://github.com/usuario/notificador-campanas.git