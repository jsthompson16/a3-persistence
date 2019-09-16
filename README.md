## Pizza Ordering Website
Jarod Thompson
http://a3-jarodthompson.glitch.me

My website allows you to order pizza from Classic Pizza, allowing up to two toppings per pizza. 
You can order a new pizza, see your orders currently being worked on, edit them, and delete them.
Click on the "View Current Orders" link to see the table of current orders, and click on the "Order now!"
link to bring back up the form to order a new pizza.

Most of the challenges I faced involved changing my code from using a local array to using lowdb to store its information. 
I had trouble with editing and deleting information in particular.

I used Passport and lowdb because they were the easiest to implement.

I used sanitize.css for my CSS framework because I wanted a simple, clean look to my website.

I used passport for user authentication. 
I used morgan to log all my HTTP requests to the console. 
I used helmet to set the HTTP request headers for me.
I used response-time and node-statsd to collect response times for my HTTP requests.

## Technical Achievements
- **Created PIXI scrolling picture**: Learned how use Pixi.js in order to create a scrolling picture of a pizza to add
                                      some color to my website

### Design/Evaluation Achievements
- **CSS**: I used two additional CSS frameworks, typography.css and forms.css, to help keep things consistent
           with the sanitize.css framework.
