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
  },
})
