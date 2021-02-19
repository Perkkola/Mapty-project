'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const body = document.querySelector('body');
const delall = document.querySelector('.btn-delall');
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    //prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / this.duration;
  }
}

// const run1 = new Running([32, -32], 5.2, 24, 178);
// const cycle1 = new Cycling([32, -32], 27, 95, 523);
// console.log(run1, cycle1);
class App {
  #map;
  #mapEvent;
  #workouts = [];
  #key;
  #edit = false;
  #markers = new Map();
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout);
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup);
    delall.addEventListener('click', this._delall);
  }

  _getPosition() {
    navigator.geolocation.getCurrentPosition(this._loadMap, function (e) {
      alert('Could not get your position!');
    });
  }

  _loadMap = pos => {
    const { latitude } = pos.coords;
    const { longitude } = pos.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm);
    this.#workouts.forEach(work => {
      // this._renderWorkout(work);
      this._renderWorkoutMarker(work);
    });
  };
  _showForm = mapE => {
    this.#mapEvent = mapE;
    form.style.display = 'grid';
    form.classList.remove('hidden');
    inputDistance.focus();
  };

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout = e => {
    function validation(...inputs) {
      return inputs.every(inp => Number.isFinite(inp) && inp > 0);
    }
    e.preventDefault();
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let lat, lng;

    //this is for getting map event after loading from loca storage
    if (this.#mapEvent) {
      lat = this.#mapEvent.latlng.lat;
      lng = this.#mapEvent.latlng.lng;
    } else {
      [lat, lng] = this.#workouts[this.#key].coords;
    }

    let workout;
    if (type == 'running') {
      const cadence = +inputCadence.value;
      if (!validation(duration, distance, cadence))
        return alert('Input invalid');

      workout = new Running([lat, lng], distance, duration, cadence);
    } else {
      const elevation = +inputElevation.value;
      if (!validation(duration, distance)) return alert('Input invalid');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //deleting old workout after edit
    if (this.#edit) {
      this._deleteMarker(true, this.#workouts[this.#key].id);
      this.#workouts.splice(this.#key, 1);
      this.#edit = false;
    }

    this.#workouts.push(workout);

    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._setLocalStorage();
    console.log(this.#workouts);
  };

  _renderWorkoutMarker(workout) {
    //setting markers in a map for easy deleting
    const mark = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${
          workout.type === ' running'
            ? '🏃‍♂' + workout.description
            : '🚴‍♀️' + workout.description
        }`
      )
      .openPopup();

    this.#markers.set(workout.id, mark);

    inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value =
      '';

    this._hideForm();
  }

  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <button class="btn">x</button>
    <h2 class="workout__title">${workout.description}</h2>
 <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
  </li>`;
    } else {
      html += ` <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
    }
    form.insertAdjacentHTML('afterend', html);

    //event listener for workout deleting

    document
      .querySelector(`.workout[data-id="${workout.id}"]`)
      .addEventListener('click', this._delete);
  }

  //for editing a workout
  _edit = (e, workout) => {
    if (
      e.target.classList.contains('workout') ||
      e.target.classList.contains('workout__title') ||
      e.target.classList.contains('btn') ||
      this.#edit
    )
      return;
    this.#edit = true;
    const value = e.target
      .closest('.workout__details')
      .querySelector('.workout__value');

    value.closest('.workout').classList.add('shidden');
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;
    inputCadence.value = workout.cadence;
    inputElevation.value = workout.elevationGain;

    body.addEventListener('click', this._close);
    this._showForm();
  };

  //closes form
  _close = e => {
    if (e.target.closest('.workout') || !this.#edit) return;

    if (this.#edit && !e.target.closest('.form')) {
      body.removeEventListener('click', this._close);
      this._reRender();
      this.#edit = false;
    }

    // if (this.#edit) return;
    // if (!e.target.closest('form')) {
    //   this._hideForm();
    //   document
    //     .querySelectorAll('.workout')
    //     .forEach(work => work.classList.remove('hidden'));
    // }
  };

  //re render everything
  _reRender = () => {
    while (form.nextElementSibling) {
      form.parentElement.removeChild(form.nextElementSibling);
    }
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });

    this._hideForm();
    document
      .querySelectorAll('.workout')
      .forEach(work => work.classList.remove('shidden'));
    this._setLocalStorage();
  };

  //for deleting workouts
  _delete = (e, del) => {
    if (!e?.target.classList.contains('btn') && !del) return;

    const elID = e?.target.parentElement.dataset.id;

    let amount = e ? 1 : this.#workouts.length;

    if (e) {
      this.#workouts.splice(
        this.#workouts.indexOf(this.#workouts.find(work => work.id === elID)),
        1
      );
    } else {
      this.#workouts = [];
    }

    this._deleteMarker(e, elID);

    this._reRender();
  };

  _deleteMarker = (e, id) => {
    if (e) {
      this.#map.removeLayer(this.#markers.get(id));
      this.#markers.delete(id);
    } else {
      this.#markers.forEach(marker => {
        this.#map.removeLayer(marker);
        this.#markers.delete(marker);
      });
    }
  };

  _delall = e => {
    this._delete(null, true);
  };

  _hideForm() {
    inputCadence.value = '';
    inputDistance.value = '';
    inputDuration.value = '';
    inputElevation.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');
    // form.style.display = 'grid';
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _moveToPopup = e => {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl || e.target.classList.contains('btn')) return;
    const workout = this.#workouts.find(
      el => el.id === workoutEl.getAttribute('data-id')
      //workoutEl.dataset.id
    );

    //saving workout index in a seprate value
    this.#key = this.#workouts.indexOf(workout);

    this.#map.setView(workout.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    this._edit(e, workout);
    // workout.click();
  };

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
      //this._renderWorkoutMarker(work);
    });
  }

  reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
}

const app = new App();
