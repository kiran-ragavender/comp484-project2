$(function() { // Makes sure that your function is called once all the DOM elements of the page are ready to be used.

  // Build one picker button per pet in the pets array
  buildPetTabs();

  // Called function to update the name, happiness, and weight of our pet in our HTML
  checkAndUpdatePetInfoInHtml();

  // The first click on any action button runs startGame() once (it hides the tip and turns on
  // sound). .one() is like .click() but the handler removes itself after running one time.
  // It is attached BEFORE the normal click handlers because jQuery runs handlers in the order
  // they were added, so the audio is ready in time for the very first meow or bark.
  $('.button-container button').one('click', startGame);

  // When each button is clicked, it will "call" function for that button (functions are below)
  $('.treat-button').click(clickedTreatButton);
  $('.play-button').click(clickedPlayButton);
  $('.exercise-button').click(clickedExerciseButton);
  $('.feed-button').click(clickedFeedButton); // New action button
  $('.sound-toggle').click(toggleSound);

  // Every few seconds every pet gets a bit hungrier, even when you are not clicking
  setInterval(passTime, HUNGER_TICK_MS);

  // Say hello when the page first loads
  showPetMessage("Hi, I'm " + pet_info['name'] + "! Take good care of me. 🐾", false);

});

// One-time setup that runs on the very first button click (attached with .one() above)
function startGame() {
  // .fadeOut(300) smoothly hides the "press any button to start" tip over 300ms
  // (see the full explanation of .fadeOut() in showPetMessage below)
  $('.hint').fadeOut(300);
  // Chrome blocks sound until the user clicks something, so audio is turned on here
  unlockAudio();
  // .one() only removes the handler from the button that was actually clicked,
  // so also remove startGame from the other three buttons
  $('.button-container button').off('click', startGame);
}

// Object constructor for a pet. Calling "new Pet(...)" makes a new pet object with these keys.
// species is "cat" or "dog" and picks the pet's messages, happiness unit, and sound.
// hunger (number) is the new stat for the Feed Meal button: 0 = completely full, 100 = starving
// image is the start of the pet's picture file names: "images/<image>.svg" is the happy picture
// and "images/<image>-sad.svg" is the sad one. description is used for the picture's alt text.
function Pet(name, species, weight, happiness, hunger, image, description) {
  this.name = name;
  this.species = species;
  this.weight = weight;
  this.happiness = happiness;
  this.hunger = hunger;
  this.image = image;
  this.description = description;
}

// Array of all the pets, each one made with the Pet constructor
var pets = [
  new Pet("Koki", "cat", 10, 10, 30, "orange-cat", "an orange tabby cat"),
  new Pet("Kuro", "cat", 8, 15, 20, "black-cat", "a black cat with a red collar"),
  new Pet("Coco", "dog", 22, 20, 40, "shiba-inu", "a Shiba Inu dog with a blue collar")
];

// Add a variable "pet_info" equal to a object with the name (string), weight (number), and happiness (number) of your pet
// pet_info always points at the pet currently being shown (starts with the first one)
var pet_info = pets[0];

// The most hunger can go up to
var MAX_HUNGER = 100;

// Happiness can keep going up, but the happiness bar is drawn as full at this value
var MAX_HAPPINESS_BAR = 50;

// How often (in milliseconds) the pets get hungrier on their own, and by how much
var HUNGER_TICK_MS = 6000;
var HUNGER_PER_TICK = 3;

// Sound settings: audioContext is created on the first click (see .one() above)
var audioContext = null;
var soundOn = true;

// Everything that is different between cats and dogs.
// unit: how happiness is measured. messages: arrays of things the pet can say after each
// button press (one line is picked at random so the messages don't repeat every click).
var species_info = {
  cat: {
    unit: "purrs per minute",
    messages: {
      treat: ["Yum, fish treats! 🐟", "Mrrrow, more please!", "You're my favorite human. 😻"],
      play: ["Pass me the ball! 🎾", "Pass me the ball, I'll catch it!", "Again! Pass me the ball!"],
      exercise: ["I'm tired... give me a break! 😿", "Give me a break, my paws hurt!", "So tired... give me a break, please!"],
      feed: ["A real meal! Thank you! 🍽️", "*happy chewing noises*", "Now THIS is dinner."]
    }
  },
  dog: {
    unit: "tail wags per minute",
    messages: {
      treat: ["TREAT?! TREAT!! 🦴", "Best. Day. EVER!", "I'll sit, I'll stay, just one more!"],
      play: ["Pass me the ball! 🎾", "Pass me the ball! I'll bring it back!", "Pass me the ball, pleeease!"],
      exercise: ["I'm tired... give me a break! 🥵", "*pant pant* Give me a break!", "So tired... give me a break, please!"],
      feed: ["Dinner! My favorite meal! 🍖", "*inhales food in 3 seconds*", "Is there seconds? Please?"]
    }
  }
};

function clickedTreatButton() {
  // Increase pet happiness
  pet_info['happiness'] = pet_info['happiness'] + 5;
  // Increase pet weight
  pet_info['weight'] = pet_info['weight'] + 2;
  // A treat takes the edge off hunger a little
  pet_info['hunger'] = pet_info['hunger'] - 5;
  checkAndUpdatePetInfoInHtml();
  reactToAction('treat');
}

function clickedPlayButton() {
  // Increase pet happiness
  pet_info['happiness'] = pet_info['happiness'] + 3;
  // Decrease pet weight
  pet_info['weight'] = pet_info['weight'] - 1;
  // Playing makes the pet a bit hungrier
  pet_info['hunger'] = pet_info['hunger'] + 10;
  checkAndUpdatePetInfoInHtml();
  reactToAction('play');
}

function clickedExerciseButton() {
  // Decrease pet happiness
  pet_info['happiness'] = pet_info['happiness'] - 2;
  // Decrease pet weight
  pet_info['weight'] = pet_info['weight'] - 3;
  // Exercise makes the pet a lot hungrier
  pet_info['hunger'] = pet_info['hunger'] + 15;
  checkAndUpdatePetInfoInHtml();
  reactToAction('exercise');
}

// New behavior for the new Feed Meal button:
// a full meal brings hunger way down, adds a little weight, and makes the pet happier
function clickedFeedButton() {
  pet_info['hunger'] = pet_info['hunger'] - 30;
  pet_info['weight'] = pet_info['weight'] + 3;
  pet_info['happiness'] = pet_info['happiness'] + 2;
  checkAndUpdatePetInfoInHtml();
  reactToAction('feed');
}

function checkAndUpdatePetInfoInHtml() {
  checkWeightAndHappinessBeforeUpdating();
  updatePetInfoInHtml();
}

// Keeps one pet's values in range (defaults to the current pet)
function checkWeightAndHappinessBeforeUpdating(pet) {
  pet = pet || pet_info;
  // Add conditional so if weight is lower than zero.
  if (pet['weight'] < 0) {
    pet['weight'] = 0;
  }
  // Same check for happiness so it can't go below zero either
  if (pet['happiness'] < 0) {
    pet['happiness'] = 0;
  }
  // Hunger has to stay between 0 (full) and MAX_HUNGER (starving)
  if (pet['hunger'] < 0) {
    pet['hunger'] = 0;
  } else if (pet['hunger'] > MAX_HUNGER) {
    pet['hunger'] = MAX_HUNGER;
  }
}

// Updates your HTML with the current values in your pet_info object
function updatePetInfoInHtml() {
  $('.name').text(pet_info['name']);
  $('.weight').text(pet_info['weight']);
  $('.happiness').text(pet_info['happiness']);
  $('.happiness-unit').text(species_info[pet_info['species']].unit);
  $('.hunger').text(pet_info['hunger']);

  // Hunger meter: the bar's width is the hunger value as a percentage,
  // and its color goes green -> orange -> red as the pet gets hungrier
  var barColor = '#6cbf6c';
  if (pet_info['hunger'] >= 75) {
    barColor = '#e05a5a';
  } else if (pet_info['hunger'] >= 50) {
    barColor = '#f0a03c';
  }
  $('.hunger-bar').css({ width: pet_info['hunger'] + '%', backgroundColor: barColor });

  // Happiness meter: happiness has no maximum, so the bar is full at MAX_HAPPINESS_BAR or more
  var happinessPercent = Math.min(pet_info['happiness'] / MAX_HAPPINESS_BAR * 100, 100);
  $('.happiness-bar').css('width', happinessPercent + '%');

  // Mood picture: show the sad picture when the pet is very hungry, unhappy, or at zero weight
  var sad = isPetSad(pet_info);
  var imageFile = 'images/' + pet_info['image'] + (sad ? '-sad' : '') + '.svg';
  $('.pet-image').attr({
    src: imageFile,
    alt: pet_info['name'] + ', ' + pet_info['description'] + (sad ? ', looking sad' : '')
  });

  // Mood badge under the pet
  $('.mood-badge')
    .text(sad ? '😢 Needs care' : '😊 Happy')
    .toggleClass('sad', sad);

  // Page theme: style.css changes the accent colors based on this attribute
  $('body').attr('data-pet', pet_info['image']);

  // Highlight the selected pet's tab
  $('.pet-tabs button').each(function(index) {
    $(this).toggleClass('active', pets[index] === pet_info);
  });
}

// A pet is sad when it is very hungry, completely unhappy, or has no weight left
function isPetSad(pet) {
  return pet['hunger'] >= 75 || pet['happiness'] === 0 || pet['weight'] === 0;
}

// Creates a button for every pet in the pets array (a small picture plus the pet's name)
// and adds it to the .pet-tabs nav
function buildPetTabs() {
  $.each(pets, function(index, pet) {
    var avatar = $('<img class="tab-avatar" alt="">').attr('src', 'images/' + pet['image'] + '.svg');
    var tab = $('<button type="button"></button>')
      .append(avatar)
      .append($('<span></span>').text(pet['name']));
    tab.click(function() {
      selectPet(index);
    });
    $('.pet-tabs').append(tab);
  });
}

// Switches which pet is shown by pointing pet_info at a different object in the array
function selectPet(index) {
  pet_info = pets[index];
  checkAndUpdatePetInfoInHtml();
  showPetMessage("It's me, " + pet_info['name'] + "!", isPetSad(pet_info));
  bouncePet();
  playPetSound(isPetSad(pet_info));
}

// Runs every HUNGER_TICK_MS: all pets get hungrier, and a starving pet slowly loses happiness
function passTime() {
  var wasStarving = pet_info['hunger'] >= MAX_HUNGER;

  $.each(pets, function(index, pet) {
    pet['hunger'] = pet['hunger'] + HUNGER_PER_TICK;
    if (pet['hunger'] >= MAX_HUNGER) {
      pet['happiness'] = pet['happiness'] - 1;
    }
    checkWeightAndHappinessBeforeUpdating(pet);
  });

  updatePetInfoInHtml();

  // Complain once when the current pet first becomes starving
  if (!wasStarving && pet_info['hunger'] >= MAX_HUNGER) {
    showPetMessage("I'm STARVING! Feed me a real meal!", true);
    playPetSound(true);
  }
}

// Picks what the pet says after a button press, makes it bounce, and plays its sound.
// Warnings (starving, weight at zero, totally unhappy) take priority over the normal lines.
function reactToAction(action) {
  var message;
  var isWarning = true;

  if (pet_info['hunger'] >= MAX_HUNGER) {
    message = "I'm STARVING! Feed me a real meal!";
  } else if (pet_info['weight'] === 0) {
    message = "I'm wasting away here... I need food!";
  } else if (pet_info['happiness'] === 0) {
    message = "Hmph. I'm not talking to you.";
  } else {
    // Normal case: pick a random line from this pet's species and action
    var options = species_info[pet_info['species']].messages[action];
    message = options[Math.floor(Math.random() * options.length)];
    isWarning = false;
  }

  showPetMessage(message, isWarning);
  bouncePet();
  playPetSound(isWarning);
}

// Visual notification: shows the pet's comment in the speech bubble above the picture
// (used instead of alert() or console.log(), which the assignment doesn't allow)
function showPetMessage(text, isWarning) {
  $('.speech-bubble')
    // .finish() (jQuery unique method #1, explained in bouncePet below) instantly completes
    // the previous message's fades so a new message can start right away
    .finish()
    .text(text)
    // adds the red "warning" style when isWarning is true and removes it when it's false
    .toggleClass('warning', isWarning)
    .fadeIn(200)
    // keep the bubble on screen for 2.5 seconds before hiding it
    .delay(2500)
    // jQuery unique method #2: .fadeOut(duration)
    // .fadeOut() hides an element smoothly by animating its opacity from fully visible down
    // to 0 over the given number of milliseconds (400ms here). When the fade is done, jQuery
    // sets the element to "display: none", so it is fully hidden and takes up no space.
    // Here it makes the speech bubble gently disappear after the pet has finished "talking",
    // instead of vanishing all at once. Because it is chained after .delay(2500), jQuery puts it
    // in the bubble's animation queue and it only starts once the 2.5 second wait is over.
    // It is also used in startGame() to fade out the starting tip after the first click.
    .fadeOut(400);
}

// Animation: makes the pet hop. .animate() moves the picture 20px up and then back down.
// The image has "position: relative" in style.css so the "top" property can move it.
function bouncePet() {
  $('.pet-image')
    // jQuery unique method #1: .finish()
    // .finish() stops the animation that is currently running on an element, removes every
    // animation still waiting in its queue, and jumps all of them straight to their end values.
    // Without it, clicking a button 5 times quickly would line up 5 hops that play one after
    // another for over a second. With .finish(), any hop already happening snaps to its end
    // (the pet back on the floor at top: 0px) and the new hop starts fresh, so the pet always
    // reacts right away to the latest click. It is also used in showPetMessage() for the same
    // reason: an old message's fade in / wait / fade out is completed instantly before the new
    // message is shown.
    .finish()
    .animate({ top: '-20px' }, 150)
    .animate({ top: '0px' }, 150);
}

// Sound effect: creates the audio context (Chrome only allows this after a click)
function unlockAudio() {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (AudioCtx && !audioContext) {
    audioContext = new AudioCtx();
  }
}

// Plays the right sound for the current pet: cats meow, dogs bark.
// When isSad is true, cats do a low, slow meow and dogs whimper.
// All sounds are synthesized with the Web Audio API, so no sound files are needed.
function playPetSound(isSad) {
  if (!soundOn || !audioContext) {
    return;
  }
  var now = audioContext.currentTime;

  if (pet_info['species'] === 'dog') {
    if (isSad) {
      // Whimper: a soft, high tone that slides down
      playTone('sine', 900, 1000, 650, now, 0.6, 0.15);
    } else {
      // "Woof woof": two short, rough tones that drop quickly in pitch
      playTone('sawtooth', 320, 260, 140, now, 0.12, 0.12);
      playTone('sawtooth', 320, 260, 140, now + 0.18, 0.12, 0.12);
    }
  } else {
    if (isSad) {
      // Sad meow: lower and slower
      playTone('triangle', 380, 570, 304, now, 0.7, 0.2);
    } else {
      // Happy meow: pitch goes up for the "mi" and down for the "ow"
      playTone('triangle', 550, 825, 440, now, 0.4, 0.2);
    }
  }
}

// Plays one tone. The pitch goes from startPitch up/down to midPitch (30% of the way through)
// and then to endPitch. The volume fades in quickly and fades out at the end so it doesn't click.
function playTone(wave, startPitch, midPitch, endPitch, startTime, length, maxVolume) {
  var oscillator = audioContext.createOscillator();
  var volume = audioContext.createGain();
  oscillator.type = wave;

  oscillator.frequency.setValueAtTime(startPitch, startTime);
  oscillator.frequency.linearRampToValueAtTime(midPitch, startTime + length * 0.3);
  oscillator.frequency.linearRampToValueAtTime(endPitch, startTime + length);

  volume.gain.setValueAtTime(0, startTime);
  volume.gain.linearRampToValueAtTime(maxVolume, startTime + 0.02);
  volume.gain.linearRampToValueAtTime(0, startTime + length);

  oscillator.connect(volume);
  volume.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + length);
}

// Turns the pet sounds on or off and updates the button label
function toggleSound() {
  soundOn = !soundOn;
  $('.sound-toggle')
    .text(soundOn ? '🔊 Sound on' : '🔇 Sound off')
    .attr('aria-pressed', String(!soundOn));
}
