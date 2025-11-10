import React from 'react'

type ConfirmDialogProps = {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog(props: ConfirmDialogProps): React.ReactElement | null {
  if (!props.open) return null

  function stop(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation()
  }

  return React.createElement(
    'div',
    {
      className: 'fs-modal-overlay',
      role: 'dialog',
      'aria-modal': 'true',
      onClick: props.onCancel
    },
    React.createElement(
      'div',
      { className: 'fs-modal-card', onClick: stop },
      React.createElement('p', { className: 'fs-modal-message', id: 'fs-modal-message' }, props.message),
      React.createElement(
        'div',
        { className: 'fs-modal-actions' },
        React.createElement(
          'button',
          { type: 'button', className: 'fs-modal-btn confirm', onClick: props.onConfirm },
          'Si'
        ),
        React.createElement(
          'button',
          { type: 'button', className: 'fs-modal-btn cancel', onClick: props.onCancel },
          'No'
        )
      )
    )
  )
}
