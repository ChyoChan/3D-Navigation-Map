import assert from 'node:assert/strict';
import test from 'node:test';
import { DESTINATIONS } from '../app/src/navigation.js';
import { matchDestinationInput } from '../app/src/destination-input.js';

test('matches every canonical destination without altering routing labels', () => {
    assert.equal(Object.keys(DESTINATIONS).length, 31);
    for (const label of Object.keys(DESTINATIONS)) {
        assert.deepEqual(matchDestinationInput(label), { label, suggestions: [] });
        assert.equal(matchDestinationInput(`  ${label.toUpperCase()}  `).label, label);
    }
});

test('accepts room prefixes and explicit facility floors with common separators', () => {
    for (const value of ['Room 501', 'room501', ' ROOM   501 ', 'Ｒｏｏｍ ５０１']) {
        assert.equal(matchDestinationInput(value).label, '501', value);
    }
    for (const value of ['elevator6f', 'Elevator 6', 'Elevator - 6F', 'elevator–6f',
        'Elevator—6F', 'Elevator . 6F', 'Elevator / 6F', 'Elevator (6F)',
        'Elevator, 6F', 'Elevator floor6', 'Elevator Floor 6F', 'lift6', 'Lift · 6F',
        'LIFT floor 6', 'Ｅｌｅｖａｔｏｒ ６Ｆ']) {
        assert.equal(matchDestinationInput(value).label, 'Elevator · 6F', value);
    }
    assert.equal(matchDestinationInput(' accessible   toilet  floor 5 ').label, 'Accessible Toilet · 5F');
    assert.equal(matchDestinationInput('male toilet 6f').label, 'Male Toilet · 6F');
    assert.equal(matchDestinationInput('female toilet 6f').label, 'Female Toilet · 6F');
});

test('requires a facility floor and offers both choices without choosing one', () => {
    for (const name of ['Accessible Toilet', 'Female Toilet', 'Male Toilet', 'Elevator', 'Escalator']) {
        assert.deepEqual(matchDestinationInput(name), {
            label: null, suggestions: [`${name} · 5F`, `${name} · 6F`]
        });
    }
    assert.deepEqual(matchDestinationInput('lift'), {
        label: null, suggestions: ['Elevator · 5F', 'Elevator · 6F']
    });
});

test('suggests partial names and floor corrections without automatic selection', () => {
    for (const value of ['elev', 'lif', 'Elevator 7F', 'lift floor 7']) {
        assert.deepEqual(matchDestinationInput(value), {
            label: null, suggestions: ['Elevator · 5F', 'Elevator · 6F']
        }, value);
    }
    assert.deepEqual(matchDestinationInput('Room 50'), {
        label: null, suggestions: ['501', '502', '503']
    });
    assert.deepEqual(matchDestinationInput('male'), {
        label: null, suggestions: ['Male Toilet · 5F', 'Male Toilet · 6F']
    });
    assert.deepEqual(matchDestinationInput('female'), {
        label: null, suggestions: ['Female Toilet · 5F', 'Female Toilet · 6F']
    });
});

test('rejects unknown, inherited, malformed and non-string inputs', () => {
    for (const value of ['', ' ', 'constructor', '__proto__', 'toString', 'constructor 5F',
        'Elevator 65F', 'Elevator 5F 6F', 'Elevator <6F>', 'Room 501x', '5 0 1',
        '5-0-1', '501 · 5F', 'Room Elevator 6F', 'Lifter6F', 'unknown',
        501, null, undefined, {}, ['501']]) {
        assert.equal(matchDestinationInput(value).label, null, String(value));
    }
    assert.deepEqual(matchDestinationInput('constructor'), { label: null, suggestions: [] });
    assert.deepEqual(matchDestinationInput(null), { label: null, suggestions: [] });
});
