import {fillProfileIdentity} from './test-profile-setup';
import {screen} from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
export async function finishNewProfile(user:ReturnType<typeof userEvent.setup>,cities=['Tokyo','Paris','Rome']){
 await fillProfileIdentity(user);await user.click(screen.getByRole('button',{name:'Next'}));await user.click(screen.getByRole('button',{name:'Skip for now'}));
 for(const city of cities){await user.click(await screen.findByRole('button',{name:'Add wishlist places'}));await user.click(screen.getByRole('button',{name:`Choose ${city}`}));await user.click((await screen.findAllByRole('button',{name:/^Select /}))[0]);await user.click(screen.getByRole('button',{name:'Add 1 wish'}));}
 await user.click(await screen.findByRole('button',{name:'Create my profile'}));
}
