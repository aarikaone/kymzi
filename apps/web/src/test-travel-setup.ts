import {screen} from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
export async function finishNewProfile(user:ReturnType<typeof userEvent.setup>,cities=['Tokyo','Paris','Rome']){
 await user.click(screen.getByRole('button',{name:'Next'}));await user.click(screen.getByRole('button',{name:'Skip for now'}));
 for(const city of cities){await user.click(screen.getByRole('button',{name:`Choose ${city}`}));await user.click(screen.getByRole('button',{name:'Add wishlist city'}));}
 await user.click(screen.getByRole('button',{name:'Create my profile'}));
}
