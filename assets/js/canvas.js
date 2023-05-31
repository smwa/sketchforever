let notebook = null;
let canvas_container = null;

const canvas_load_id = async (_id) => {
  try {
    notebook = (await LF.getItem(NOTEBOOK_KEY)).filter((notebook) => notebook.id === _id)[0];
  }
  catch (e) {
    window.location = './';
  }
  canvas_container = document.querySelector('.notebook-backdrop');

  const action_container = document.createElement('div');
  action_container.classList = 'action-container';

  const action_handle = document.createElement('div');
  action_handle.classList = 'action-handle';

  const action_handle_icon = document.createElement('i');
  action_handle_icon.dataset.feather = 'align-justify';
  action_handle.appendChild(action_handle_icon);

  action_container.appendChild(action_handle);

  canvas_container.appendChild(action_container);




  const canvas_container_position = { x: 0, y: 0 }

  interact('.action-container')
  .draggable({
    inertia: true,
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: 'parent',
        endOnly: true
      })
    ],
    allowFrom: '.action-handle',
    listeners: {
      move (event) {
        canvas_container_position.x += event.dx
        canvas_container_position.y += event.dy
  
        event.target.style.transform =
          `translate(${canvas_container_position.x}px, ${canvas_container_position.y}px)`
      },
    }
  });

  requestAnimationFrame(() => setTimeout(() => {
    feather.replace();    
  }, 0))
};

const canvas_close = async () => {
  notebook = null;
  window.history.back();
  canvas_container = null;
};
