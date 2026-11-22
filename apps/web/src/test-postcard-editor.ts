import {screen} from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import {postcardQuestions} from '@rymzi/core';
export async function packPostcard(u:ReturnType<typeof userEvent.setup>){const questions=postcardQuestions('','25-30').slice(0,3);for(let i=0;i<3;i++){await u.click(screen.getByRole('button',{name:`Choose question ${i+1}`}));await u.click(screen.getByRole('button',{name:questions[i].prompt}));await u.click(screen.getByRole('radio',{name:questions[i].choices![0].label}));await u.click(screen.getByRole('button',{name:'Pack this pick'}));await screen.findByLabelText('Packing your pick');await u.click(screen.getByRole('button',{name:'Continue'}));}return questions;}
