const LF = localforage;
const NOTEBOOK_KEY = 'sketchforever_notebooks';
const regex_color = /^#[0-9a-fA-F]{6}$/;

const notebook_element = document.querySelector('.notebooks');

let is_editing = false;

const NOTEBOOK_COLORS = [
  '#dcad93',
  '#a1cfd0',
  '#80461b',
  '#bedbed',
  '#ace1af',
  '#f36a6f',
  '#b5e288',
  '#e66d74',
  '#d2c661',
  '#a3748f',
  '#c1737b',
  '#e8a435',
  '#277e71',
  '#76abdf',
  '#b6c3a3',
  '#ba7373',
  '#c7b669',
  '#9fcb8d',
  '#d09791',
  '#d0906c',
  '#007791',
  '#2cccd3',
  '#9e93a7',
  '#62c1d0',
  '#09443c',
  '#c97171',
  '#ce5f38',
  '#df9162',
  '#72e6cb',
  '#daa06d',
  '#efa514',
];

let current_notebook_id = null;

const render_notebooks = async () => {
  LF.getItem(NOTEBOOK_KEY).then((value) => {
    notebook_element.innerHTML = '';
    value.forEach((notebook) => {

      const notebook_anchor = document.createElement('a');
      notebook_anchor.href = `./?notebook=${notebook.id}`;

      const notebook_icon_container = document.createElement('div');

      const notebook_icon = document.createElement('i');
      notebook_icon.dataset.feather = 'book';
      notebook_icon.style.stroke = notebook.color;
      notebook_icon_container.appendChild(notebook_icon);
      notebook_anchor.appendChild(notebook_icon_container);

      const notebook_label = document.createElement('div');
      notebook_label.innerText = notebook.name;
      notebook_anchor.appendChild(notebook_label);

      notebook_element.appendChild(notebook_anchor);
    })

    // Add "add notebook"
    const notebook_anchor = document.createElement('a');
    notebook_anchor.href = `./?new=1`;
    notebook_anchor.classList = 'new-notebook-anchor';
    const notebook_icon_container = document.createElement('div');
    notebook_icon_container.classList = 'new-notebook-icon-container';
    const notebook_icon = document.createElement('i');
    notebook_icon.dataset.feather = 'plus';
    notebook_icon.style.stroke = '#4169e1';
    notebook_icon_container.appendChild(notebook_icon);
    notebook_anchor.appendChild(notebook_icon_container);

    const notebook_label = document.createElement('div');
    notebook_label.classList = 'new-notebook-label notebook-label';
    notebook_label.innerText = 'New notebook';
    notebook_anchor.appendChild(notebook_label);

    notebook_element.appendChild(notebook_anchor);

    // Render feather icons
    requestAnimationFrame(() => setTimeout(() => {
      feather.replace();
    }, 0))

  }).catch(function (err) {
    LF.setItem(NOTEBOOK_KEY, [])
      .then(() => {
        render_notebooks();
      })
  });
};

const render_editable_notebooks = async () => {
  LF.getItem(NOTEBOOK_KEY).then((value) => {
    notebook_element.innerHTML = '';
    value.forEach(async (notebook, index) => {

      const notebook_anchor = document.createElement('div');
      notebook_anchor.classList = `notebook-${notebook.id}`;

      const notebook_icon_container = document.createElement('div');
      notebook_icon_container.style.cursor = 'pointer';

      const notebook_icon = document.createElement('i');
      notebook_icon_container.onclick = async (evt) => {
        const color_index = NOTEBOOK_COLORS.indexOf(notebook.color) + 1;
        value[index].color = NOTEBOOK_COLORS[color_index % NOTEBOOK_COLORS.length]
        await LF.setItem(NOTEBOOK_KEY, value);
        [...document.querySelectorAll(`.notebook-${notebook.id} svg`)].forEach((elem) => {
          elem.style.stroke = value[index].color;
        });
      }
      notebook_icon.dataset.feather = 'book';
      notebook_icon.style.stroke = notebook.color;
      notebook_icon_container.appendChild(notebook_icon);
      notebook_anchor.appendChild(notebook_icon_container);


      const notebook_label = document.createElement('div');
      notebook_label.classList = 'edit-notebook-label notebook-label';
      const input = document.createElement('input');
      input.onblur = async (evt) => {
        value[index].name = evt.target.value;
        await LF.setItem(NOTEBOOK_KEY, value);
      };
      input.onkeydown = async (evt) => {
        if (evt.key !== 'Enter') {
          return;
        }
        evt.preventDefault();
        value[index].name = evt.target.value;
        await LF.setItem(NOTEBOOK_KEY, value);
        document.querySelector('.edit-button').click();
      };
      input.classList = 'notebook-label-input edit-notebook-label-input';
      input.value = notebook.name;
      notebook_label.appendChild(input);
      
      notebook_anchor.appendChild(notebook_label);

      const notebook_delete_container = document.createElement('div');
      const notebook_delete_icon = document.createElement('i');
      notebook_delete_container.onclick = async (evt) => {
        const new_notebooks = value.filter((n) => n.id !== notebook.id);
        await LF.setItem(NOTEBOOK_KEY, new_notebooks);
        await render_editable_notebooks();
      }
      notebook_delete_icon.dataset.feather = 'trash-2';
      notebook_delete_icon.style.stroke = notebook.color;
      notebook_delete_container.appendChild(notebook_delete_icon);
      notebook_anchor.appendChild(notebook_delete_container);

      notebook_element.appendChild(notebook_anchor);
    })

    // Render feather icons
    requestAnimationFrame(() => setTimeout(() => {
      feather.replace();
    }, 0))

  });
};

const request_new_notebook = async () => {
  const label_container = document.querySelector('.new-notebook-label');
  const name = label_container.innerText;
  label_container.innerHTML = '';
  const input = document.createElement('input');
  input.onblur = on_new_notebook_label_blur;
  input.onkeydown = on_new_notebook_label_blur;
  input.classList = 'notebook-label-input new-notebook-label-input';
  input.value = name;
  label_container.appendChild(input);

  requestAnimationFrame(() => setTimeout(() => {
    input.focus();
    input.selectionStart = 0;
    input.selectionEnd = input.value.length;
  }, 0))
};

const create_new_notebook = async (_name, _color) => {
  if (!regex_color.test(_color)) {
    throw new Error("Color is not valid, must be a hex string, i.e. #4169e1");
  }
  const value = await LF.getItem(NOTEBOOK_KEY);
  const id = parseInt((new Date()).getTime(), 10);
  value.push({
    id: id,
    name: _name,
    color: _color,
    pages: [],
  });
  await LF.setItem(NOTEBOOK_KEY, value);
  await render_notebooks();
  window.history.back();
};

const open_notebook = async (_id) => {
  console.log(`opened ${_id}`);
  current_notebook_id = _id;

  const notebookBackdrop = document.createElement('div');
  notebookBackdrop.classList = 'notebook-backdrop';
  document.body.appendChild(notebookBackdrop);
  await canvas_load_id(current_notebook_id);
  if (notebookBackdrop.requestFullscreen) {
    notebookBackdrop.requestFullscreen();
  } else if (notebookBackdrop.webkitRequestFullscreen) {
  notebookBackdrop.webkitRequestFullscreen();
  } else if (notebookBackdrop.msRequestFullscreen) {
  notebookBackdrop.msRequestFullscreen();
  }
};

const close_notebook = async () => {
  if (current_notebook_id === null) return;
  console.log('closed')
  current_notebook_id = null;
  document.body.removeChild(document.querySelector('.notebook-backdrop'));
};

render_notebooks();

const handle_url = async () => {
  const params = new URLSearchParams(document.location.search);
  const id = params.get("notebook");
  if (id !== null) {
    open_notebook(id);
  }
  else if (params.get('new') !== null) {
    request_new_notebook();
  }
  else {
    await render_notebooks();
    await close_notebook();
  }
};

window.addEventListener('popstate', handle_url);
setTimeout(handle_url, 1);

notebook_element.addEventListener('click', (evt) => {
  const anchor = evt.target.closest('a');
  if (anchor === null) return;
  evt.preventDefault();

  const params = new URLSearchParams(document.location.search);
  if (params.get('new') !== null) {
    if (evt.target.classList.contains('new-notebook-anchor')) {
      return;
    }
  }

  window.history.pushState({}, '', anchor.href);
  setTimeout(handle_url, 1);
});

const on_new_notebook_label_blur = (evt) => {
  if (evt.type !== 'blur') {
    if (evt.key !== 'Enter') {
      return;
    }
    evt.preventDefault();
  }
  evt.target.onblur = null;
  evt.target.onkeydown = null;
  LF.getItem(NOTEBOOK_KEY).then((notebooks) => {
    const new_color = NOTEBOOK_COLORS[notebooks.length % NOTEBOOK_COLORS.length];
    create_new_notebook(evt.target.value, new_color);
  });
}

document.querySelector('.edit-button').addEventListener('click', (evt) => {
  if (!is_editing) {
    is_editing = true;
    document.querySelector('.edit-button-label').innerText = 'Editing';
    render_editable_notebooks();
  }
  else {
    is_editing = false;
    document.querySelector('.edit-button-label').innerText = 'Edit';
    render_notebooks();
  }
});
