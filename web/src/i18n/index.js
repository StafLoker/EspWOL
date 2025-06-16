import { createI18n } from 'vue-i18n'

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      header: {
        home: 'Home',
        settings: 'Settings',
        account: 'Account',
        language: 'Language',
        theme: 'Theme',
      },
      languages: {
        en: 'English',
        es: 'Español',
        ru: 'Русский'
      },
      theme: {
        light: 'Light',
        dark: 'Dark',
        toggle: 'Toggle theme'
      },
      pages: {
        login: {
          title: 'Sign in your account',
          message: 'Welcome back!',
          username: 'Username',
          placeholderUsername: 'Please enter username',
          password: 'Password',
          placeholderPassword: 'Please enter password',
          signin: 'Sign in',
          invalidCredentials: 'Invalid credentials',
        },
        home: {
          hosts: 'Hosts',
          addHost: 'Add',
          deleteHost: {
            title: 'Are you absolutely sure?',
            description:
              'This action cannot be undone. This will permanently delete the host {hostName} ({hostIp}) from your list.',
            cancel: 'Cancel',
            confirm: 'Yes, delete host',
          },
        },
        settings: {
          title: 'Settings',
          saving: 'Saving...',
          systemInfo: {
            title: 'System Information',
            version: 'Version',
            hostname: 'Hostname',
            update: 'Update'
          },
          network: {
            title: 'Network Settings',
            mode: 'Network Mode',
            staticIP: 'Static IP',
            dhcp: 'DHCP',
            ipAddress: 'IP Address',
            networkMask: 'Network Mask',
            gateway: 'Gateway',
            dns: 'DNS Server',
            resetWiFi: 'Reset WiFi',
            save: 'Save Settings'
          },
          data: {
            title: 'Data Management',
            export: {
              title: 'Export Database',
              description: 'Export your hosts database to a CSV file.',
              button: 'Export to CSV',
              exporting: 'Exporting...'
            },
            import: {
              title: 'Import Database',
              description: 'Import hosts from a CSV file.',
              button: 'Import from CSV',
              importing: 'Importing...'
            }
          },
          updateDialog: {
            title: 'System Update',
            upToDate: 'You are up to date! No updates available.',
            newVersionAvailable: 'A new version is available for your system.',
            currentVersion: 'Current Version',
            latestVersion: 'Latest Version',
            releaseNotes: 'Release Notes',
            close: 'Close',
            update: 'Update Now',
            updating: 'Updating...'
          },
          wifiResetDialog: {
            title: 'Reset WiFi Settings',
            description: 'Are you sure you want to reset WiFi settings? This will clear all saved WiFi credentials and the device will restart in AP mode.',
            cancel: 'Cancel',
            confirm: 'Yes, reset WiFi'
          }
        },
        account: {
          title: 'Account Settings',
          authentication: {
            title: 'Authentication Settings',
            username: 'Username',
            usernamePlaceholder: 'Enter username',
            usernameHelper: 'Username must be at least 3 characters long.',
            currentPassword: 'Current Password',
            currentPasswordPlaceholder: 'Enter your current password',
            password: 'Password',
            newPassword: 'New Password',
            passwordPlaceholder: 'Enter password',
            confirmPassword: 'Confirm Password',
            confirmPasswordPlaceholder: 'Confirm your password',
            requirements: {
              length: 'At least 8 characters',
              uppercase: 'At least one uppercase letter',
              lowercase: 'At least one lowercase letter',
              number: 'At least one number',
              special: 'At least one special character'
            },
            save: 'Save Changes',
            saving: 'Saving...'
          },
          session: {
            title: 'Session Management',
            description: 'End your current session and return to the login screen.',
            logout: 'Logout',
            loggingOut: 'Logging out...'
          }
        }
      },
      components: {
        hostDialog: {
          addTitle: 'Add Host',
          editTitle: 'Edit Host',
          addDescription: 'Enter the information for the new host you want to add.',
          editDescription: 'Modify the information for the selected host.',
          hostName: 'Host Name',
          hostNamePlaceholder: 'e.g. Main Server',
          macAddress: 'MAC Address',
          macAddressPlaceholder: 'AA:BB:CC:DD:EE:FF',
          ipAddress: 'IP Address',
          ipAddressPlaceholder: '192.168.1.100',
          periodicPing: 'Periodic Ping',
          periodicPingPlaceholder: 'Select frequency...',
          lastPing: 'Last ping',
          cancel: 'Cancel',
          save: 'Save Changes',
          add: 'Add Host',
          saving: 'Saving...',
          adding: 'Adding...',
          notAvailable: 'N/A',
          periodicOptions: {
            disabled: 'Disabled',
            oneMinute: '1 minute',
            fiveMinutes: '5 minutes',
            tenMinutes: '10 minutes',
            fifteenMinutes: '15 minutes',
            thirtyMinutes: '30 minutes',
            fortyFiveMinutes: '45 minutes',
            oneHour: '1 hour',
            threeHours: '3 hours',
            sixHours: '6 hours',
            twelveHours: '12 hours',
            twentyFourHours: '24 hours',
          },
          timeFormats: {
            lessThanMinute: 'less than a minute ago',
            oneMinuteAgo: '1 minute ago',
            minutesAgo: '{minutes} minutes ago',
            oneHourAgo: '1 hour ago',
            hoursAgo: '{hours} hours ago',
          },
        },
      },
    },
    es: {
      header: {
        home: 'Inicio',
        settings: 'Configuración',
        account: 'Cuenta',
        language: 'Idioma',
        theme: 'Tema',
      },
      languages: {
        en: 'English',
        es: 'Español',
        ru: 'Русский'
      },
      theme: {
        light: 'Claro',
        dark: 'Oscuro',
        toggle: 'Cambiar tema'
      },
      pages: {
        login: {
          title: 'Inicia sesión en tu cuenta',
          message: '¡Bienvenido de vuelta!',
          username: 'Usuario',
          placeholderUsername: 'Ingresa tu usuario',
          password: 'Contraseña',
          placeholderPassword: 'Ingresa tu contraseña',
          signin: 'Iniciar sesión',
          invalidCredentials: 'Credenciales inválidas',
        },
        home: {
          hosts: 'Hosts',
          addHost: 'Agregar',
          deleteHost: {
            title: '¿Estás absolutamente seguro?',
            description:
              'Esta acción no se puede deshacer. Esto eliminará permanentemente el host {hostName} ({hostIp}) de tu lista.',
            cancel: 'Cancelar',
            confirm: 'Sí, eliminar host',
          },
        },
        settings: {
          title: 'Configuración',
          saving: 'Guardando...',
          systemInfo: {
            title: 'Información del Sistema',
            version: 'Versión',
            hostname: 'Hostname',
            update: 'Actualizar'
          },
          network: {
            title: 'Configuración de Red',
            mode: 'Modo de Red',
            staticIP: 'IP Estática',
            dhcp: 'DHCP',
            ipAddress: 'Dirección IP',
            networkMask: 'Máscara de Red',
            gateway: 'Puerta de Enlace',
            dns: 'Servidor DNS',
            resetWiFi: 'Resetear WiFi',
            save: 'Guardar Configuración'
          },
          data: {
            title: 'Gestión de Datos',
            export: {
              title: 'Exportar Base de Datos',
              description: 'Exporta tu base de datos de hosts a un archivo CSV.',
              button: 'Exportar a CSV',
              exporting: 'Exportando...'
            },
            import: {
              title: 'Importar Base de Datos',
              description: 'Importa hosts desde un archivo CSV.',
              button: 'Importar desde CSV',
              importing: 'Importando...'
            }
          },
          updateDialog: {
            title: 'Actualización del Sistema',
            upToDate: '¡Estás actualizado! No hay actualizaciones disponibles.',
            newVersionAvailable: 'Una nueva versión está disponible para tu sistema.',
            currentVersion: 'Versión Actual',
            latestVersion: 'Última Versión',
            releaseNotes: 'Notas de la Versión',
            close: 'Cerrar',
            update: 'Actualizar Ahora',
            updating: 'Actualizando...'
          },
          wifiResetDialog: {
            title: 'Resetear Configuración WiFi',
            description: '¿Estás seguro de que quieres resetear la configuración WiFi? Esto eliminará todas las credenciales WiFi guardadas y el dispositivo se reiniciará en modo AP.',
            cancel: 'Cancelar',
            confirm: 'Sí, resetear WiFi'
          }
        },
        account: {
          title: 'Configuración de Cuenta',
          authentication: {
            title: 'Configuración de Autenticación',
            username: 'Usuario',
            usernamePlaceholder: 'Ingresa usuario',
            usernameHelper: 'El usuario debe tener al menos 3 caracteres.',
            currentPassword: 'Contraseña Actual',
            currentPasswordPlaceholder: 'Ingresa tu contraseña actual',
            password: 'Contraseña',
            newPassword: 'Nueva Contraseña',
            passwordPlaceholder: 'Ingresa contraseña',
            confirmPassword: 'Confirmar Contraseña',
            confirmPasswordPlaceholder: 'Confirma tu contraseña',
            requirements: {
              length: 'Al menos 8 caracteres',
              uppercase: 'Al menos una letra mayúscula',
              lowercase: 'Al menos una letra minúscula',
              number: 'Al menos un número',
              special: 'Al menos un carácter especial'
            },
            save: 'Guardar Cambios',
            saving: 'Guardando...'
          },
          session: {
            title: 'Gestión de Sesión',
            description: 'Finaliza tu sesión actual y regresa a la pantalla de inicio de sesión.',
            logout: 'Cerrar Sesión',
            loggingOut: 'Cerrando sesión...'
          }
        }
      },
      components: {
        hostDialog: {
          addTitle: 'Agregar Host',
          editTitle: 'Editar Host',
          addDescription: 'Ingresa la información del nuevo host que quieres agregar.',
          editDescription: 'Modifica la información del host seleccionado.',
          hostName: 'Nombre del Host',
          hostNamePlaceholder: 'ej. Servidor Principal',
          macAddress: 'Dirección MAC',
          macAddressPlaceholder: 'AA:BB:CC:DD:EE:FF',
          ipAddress: 'Dirección IP',
          ipAddressPlaceholder: '192.168.1.100',
          periodicPing: 'Ping Periódico',
          periodicPingPlaceholder: 'Seleccionar frecuencia...',
          lastPing: 'Último ping',
          cancel: 'Cancelar',
          save: 'Guardar Cambios',
          add: 'Agregar Host',
          saving: 'Guardando...',
          adding: 'Agregando...',
          notAvailable: 'N/A',
          periodicOptions: {
            disabled: 'Deshabilitado',
            oneMinute: '1 minuto',
            fiveMinutes: '5 minutos',
            tenMinutes: '10 minutos',
            fifteenMinutes: '15 minutos',
            thirtyMinutes: '30 minutos',
            fortyFiveMinutes: '45 minutos',
            oneHour: '1 hora',
            threeHours: '3 horas',
            sixHours: '6 horas',
            twelveHours: '12 horas',
            twentyFourHours: '24 horas',
          },
          timeFormats: {
            lessThanMinute: 'hace menos de un minuto',
            oneMinuteAgo: 'hace 1 minuto',
            minutesAgo: 'hace {minutes} minutos',
            oneHourAgo: 'hace 1 hora',
            hoursAgo: 'hace {hours} horas',
          },
        },
      },
    },
    ru: {
      header: {
        home: 'Главная',
        settings: 'Настройки',
        account: 'Аккаунт',
        language: 'Язык',
        theme: 'Тема',
      },
      languages: {
        en: 'English',
        es: 'Español',
        ru: 'Русский'
      },
      theme: {
        light: 'Светлая',
        dark: 'Темная',
        toggle: 'Переключить тему'
      },
      pages: {
        login: {
          title: 'Войти в ваш аккаунт',
          message: 'Добро пожаловать!',
          username: 'Имя пользователя',
          placeholderUsername: 'Введите имя пользователя',
          password: 'Пароль',
          placeholderPassword: 'Введите пароль',
          signin: 'Войти',
          invalidCredentials: 'Неверные учетные данные',
        },
        home: {
          hosts: 'Хосты',
          addHost: 'Добавить',
          deleteHost: {
            title: 'Вы абсолютно уверены?',
            description:
              'Это действие нельзя отменить. Это навсегда удалит хост {hostName} ({hostIp}) из вашего списка.',
            cancel: 'Отмена',
            confirm: 'Да, удалить хост',
          },
        },
        settings: {
          title: 'Настройки',
          saving: 'Сохранение...',
          systemInfo: {
            title: 'Информация о Системе',
            version: 'Версия',
            hostname: 'Имя хоста',
            update: 'Обновить'
          },
          network: {
            title: 'Настройки Сети',
            mode: 'Режим Сети',
            staticIP: 'Статический IP',
            dhcp: 'DHCP',
            ipAddress: 'IP-адрес',
            networkMask: 'Маска Сети',
            gateway: 'Шлюз',
            dns: 'DNS Сервер',
            resetWiFi: 'Сбросить WiFi',
            save: 'Сохранить Настройки'
          },
          data: {
            title: 'Управление Данными',
            export: {
              title: 'Экспорт Базы Данных',
              description: 'Экспортируйте вашу базу данных хостов в CSV файл.',
              button: 'Экспорт в CSV',
              exporting: 'Экспорт...'
            },
            import: {
              title: 'Импорт Базы Данных',
              description: 'Импортируйте хосты из CSV файла.',
              button: 'Импорт из CSV',
              importing: 'Импорт...'
            }
          },
          updateDialog: {
            title: 'Обновление Системы',
            upToDate: 'Вы обновлены! Нет доступных обновлений.',
            newVersionAvailable: 'Новая версия доступна для вашей системы.',
            currentVersion: 'Текущая Версия',
            latestVersion: 'Последняя Версия',
            releaseNotes: 'Примечания к Выпуску',
            close: 'Закрыть',
            update: 'Обновить Сейчас',
            updating: 'Обновление...'
          },
          wifiResetDialog: {
            title: 'Сброс Настроек WiFi',
            description: 'Вы уверены, что хотите сбросить настройки WiFi? Это очистит все сохраненные учетные данные WiFi и устройство перезапустится в режиме AP.',
            cancel: 'Отмена',
            confirm: 'Да, сбросить WiFi'
          }
        },
        account: {
          title: 'Настройки Аккаунта',
          authentication: {
            title: 'Настройки Аутентификации',
            username: 'Имя пользователя',
            usernamePlaceholder: 'Введите имя пользователя',
            usernameHelper: 'Имя пользователя должно быть не менее 3 символов.',
            currentPassword: 'Текущий Пароль',
            currentPasswordPlaceholder: 'Введите ваш текущий пароль',
            password: 'Пароль',
            newPassword: 'Новый Пароль',
            passwordPlaceholder: 'Введите пароль',
            confirmPassword: 'Подтвердить Пароль',
            confirmPasswordPlaceholder: 'Подтвердите ваш пароль',
            requirements: {
              length: 'Не менее 8 символов',
              uppercase: 'Не менее одной заглавной буквы',
              lowercase: 'Не менее одной строчной буквы',
              number: 'Не менее одной цифры',
              special: 'Не менее одного специального символа'
            },
            save: 'Сохранить Изменения',
            saving: 'Сохранение...'
          },
          session: {
            title: 'Управление Сессией',
            description: 'Завершите текущую сессию и вернитесь к экрану входа.',
            logout: 'Выйти',
            loggingOut: 'Выход...'
          }
        }
      },
      components: {
        hostDialog: {
          addTitle: 'Добавить Хост',
          editTitle: 'Редактировать Хост',
          addDescription: 'Введите информацию о новом хосте, который вы хотите добавить.',
          editDescription: 'Измените информацию о выбранном хосте.',
          hostName: 'Имя Хоста',
          hostNamePlaceholder: 'например, Основной Сервер',
          macAddress: 'MAC-адрес',
          macAddressPlaceholder: 'AA:BB:CC:DD:EE:FF',
          ipAddress: 'IP-адрес',
          ipAddressPlaceholder: '192.168.1.100',
          periodicPing: 'Периодический Пинг',
          periodicPingPlaceholder: 'Выберите частоту...',
          lastPing: 'Последний пинг',
          cancel: 'Отмена',
          save: 'Сохранить Изменения',
          add: 'Добавить Хост',
          saving: 'Сохранение...',
          adding: 'Добавление...',
          notAvailable: 'Н/Д',
          periodicOptions: {
            disabled: 'Отключено',
            oneMinute: '1 минута',
            fiveMinutes: '5 минут',
            tenMinutes: '10 минут',
            fifteenMinutes: '15 минут',
            thirtyMinutes: '30 минут',
            fortyFiveMinutes: '45 минут',
            oneHour: '1 час',
            threeHours: '3 часа',
            sixHours: '6 часов',
            twelveHours: '12 часов',
            twentyFourHours: '24 часа',
          },
          timeFormats: {
            lessThanMinute: 'менее минуты назад',
            oneMinuteAgo: '1 минуту назад',
            minutesAgo: '{minutes} минут назад',
            oneHourAgo: '1 час назад',
            hoursAgo: '{hours} часов назад',
          },
        },
      },
    },
  },
})
