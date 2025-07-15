export function getImportStatus(importResult) {
  const { imported, ignored, total } = importResult

  if (imported === 0 && ignored > 0) {
    return {
      type: 'error',
      color: 'red',
      icon: 'cancel',
    }
  } else if (ignored > imported) {
    return {
      type: 'warning',
      color: 'yellow',
      icon: 'warning',
    }
  } else if (imported > 0) {
    return {
      type: 'success',
      color: 'green',
      icon: 'check_circle',
    }
  } else {
    return {
      type: 'info',
      color: 'blue',
      icon: 'info',
    }
  }
}
