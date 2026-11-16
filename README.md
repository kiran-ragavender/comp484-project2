# Giga Pets

**▶ Play it live: [https://kiran-ragavender.github.io/comp484-project2/](https://kiran-ragavender.github.io/comp484-project2/)**

A virtual pet game built with HTML, CSS, JavaScript, and jQuery for COMP 484 Project 2.
Take care of three pets: **Koki** (orange cat), **Kuro** (black cat), and **Coco** (Shiba Inu).

## How to play

- Pick a pet with the tabs at the top.
- **🦴 Treat**: more happiness and weight.
- **🎾 Play**: more happiness, less weight.
- **🏃 Exercise**: less happiness and less weight.
- **🍽️ Feed Meal** (new button): lowers hunger, adds a little weight and happiness.
- Pets get hungrier over time. If you ignore them, they get sad.

## Project requirements

| Requirement | Where it is |
|---|---|
| `pet_info` object with `name`, `weight`, `happiness` | `script.js`: `pet_info` points to the selected pet object |
| Treat, Play, and Exercise behaviors | `clickedTreatButton()`, `clickedPlayButton()`, `clickedExerciseButton()` |
| Values can't go below zero | `checkWeightAndHappinessBeforeUpdating()` |
| New action button | 🍽️ Feed Meal |
| New behavior for the new button | Hunger stat and meter, shown below Happiness |
| Visual notification after each button press (no `alert()` or `console.log()`) | Speech bubble above the pet, `showPetMessage()` |
| Two unique jQuery methods | [`.finish()`](https://api.jquery.com/finish/) and [`.fadeOut()`](https://api.jquery.com/fadeOut/), explained in comments in `script.js` |
| New image | Original SVG pets in `images/`, replacing the starter image |

## Extra features

- Multiple pets created with a `Pet` object constructor.
- Happy and sad pictures for each pet that change based on its stats.
- Hop animation, and meow or bark sound effects made with the Web Audio API.
- Hunger rises automatically every few seconds.
- The page colors change to match the selected pet.
- The layout fits on one screen on laptops and stacks on phones.

## jQuery methods

- **[`.finish()`](https://api.jquery.com/finish/)** stops the running animation, clears the animation queue, and jumps to the end values. It keeps rapid clicks from stacking up hops and speech-bubble fades.
- **[`.fadeOut()`](https://api.jquery.com/fadeOut/)** fades an element to transparent and then hides it. It hides the speech bubble after the pet finishes talking, and fades out the starting tip after the first click.
