public var idleAnimation : AnimationClip;
public var walkAnimation : AnimationClip;
public var runAnimation : AnimationClip;
public var jumpPoseAnimation : AnimationClip;

public var walkMaxAnimationSpeed : float = 0.75;
public var trotMaxAnimationSpeed : float = 1.0;
public var runMaxAnimationSpeed : float = 1.0;
public var jumpAnimationSpeed : float = 1.15;
public var landAnimationSpeed : float = 1.0;

var runSpeed = 6.0;
var dashSpeed = 10.0;

var inAirControlAcceleration = 3.0;

// How high do we jump when pressing jump and letting go immediately
var jumpHeight = 0.5;
var canPowerJump = false;
// We add extraJumpHeight meters on top when holding the button down longer while jumping
var powerJumpHeight = 2.5;

// The gravity for the character
var gravity = 20.0;
// The gravity in controlled descent mode
var canGlide = false;
var glideGravity = 2.0;
var speedSmoothing = 10.0;
var rotateSpeed = 500.0;

var canJump = true;

private var jumpRepeatTime = 0.05;
private var wallJumpTimeout = 0.15;
private var jumpTimeout = 0.15;
private var groundedTimeout = 0.25;

// The camera doesnt start following the target immediately but waits for a split second to avoid too much waving around.
private var lockCameraTimer = 0.0;

// The current move direction in x-z
private var moveDirection = Vector3.zero;
// The current vertical speed
private var verticalSpeed = 0.0;
// The current x-z move speed
private var moveSpeed = 0.0;

// The last collision flags returned from controller.Move
private var collisionFlags : CollisionFlags; 

// Are we jumping? (Initiated with jump button and not grounded yet)
private var jumping = false;
private var jumpingReachedApex = false;

// Are we moving backwards (This locks the camera to not do a 180 degree spin)
private var movingBack = false;
private var v;
private var h;
// Is the user pressing any keys?
private var isMoving = false;
// When did the user start walking (Used for going into trot after a while)
private var walkTimeStart = 0.0;
// Last time the jump button was clicked down
private var lastJumpButtonTime = -10.0;
// Last time we performed a jump
private var lastJumpTime = -1.0;
// Average normal of the last touched geometry
private var wallJumpContactNormal : Vector3;
private var wallJumpContactNormalHeight : float;

// the height we jumped from (Used to determine for how long to apply extra jump power after jumping.)
private var lastJumpStartHeight = 0.0;
// When did we touch the wall the first time during this jump (Used for wall jumping)
private var touchWallJumpTime = -1.0;

private var inAirVelocity = Vector3.zero;

private var lastGroundedTime = 0.0;

private var lean = 0.0;
private var slammed = false;

private var isControllable = true;

var canDoubleJump = true;
private var jumpsAvailable = 0;
private var didDoubleJump = false;
var canDash = true;
private var startedDashing = 0.0;
private var didDash = false;
private var lastVerticalButtonPressed = 0.0;
private var lastVerticalValue = 0.0;

function Awake ()
{
	moveDirection = transform.TransformDirection(Vector3.forward);
	_animation = GetComponent(Animation);
	if(!_animation)
		Debug.Log("The character you would like to control doesn't have animations. Moving her might look weird.");
	
	if(!idleAnimation) {
		_animation = null;
		Debug.Log("No idle animation found. Turning off animations.");
	}
	if(!walkAnimation) {
		_animation = null;
		Debug.Log("No walk animation found. Turning off animations.");
	}
	if(!runAnimation) {
		_animation = null;
		Debug.Log("No run animation found. Turning off animations.");
	}
	if(!jumpPoseAnimation && canJump) {
		_animation = null;
		Debug.Log("No jump animation found and the character has canJump enabled. Turning off animations.");
	}
}

// This next function responds to the "HidePlayer" message by hiding the player. 
// The message is also 'replied to' by identically-named functions in the collision-handling scripts.
// - Used by the LevelStatus script when the level completed animation is triggered.

function HidePlayer()
{
	GameObject.Find("rootJoint").GetComponent(SkinnedMeshRenderer).enabled = false; // stop rendering the player.
	isControllable = false;	// disable player controls.
}

// This is a complementary function to the above. We don't use it in the tutorial, but it's included for
// the sake of completeness. (I like orthogonal APIs; so sue me!)

function ShowPlayer()
{
	GameObject.Find("rootJoint").GetComponent(SkinnedMeshRenderer).enabled = true; // start rendering the player again.
	isControllable = true;	// allow player to control the character again.
}


function UpdateSmoothedMovementDirection ()
{
	var cameraTransform = Camera.main.transform;
	var grounded = IsGrounded();
	
	// Forward vector relative to the camera along the x-z plane	
	var forward = cameraTransform.TransformDirection(Vector3.forward);
	forward.y = 0;
	forward = forward.normalized;

	// Right vector relative to the camera
	// Always orthogonal to the forward vector
	var right = Vector3(forward.z, 0, -forward.x);

	v = Input.GetAxisRaw("Vertical");
	h = Input.GetAxisRaw("Horizontal");

	// Are we moving backwards or looking backwards
	if (v < -0.2)
		movingBack = true;
	else
		movingBack = false;
	
	var wasMoving = isMoving;
	isMoving = Mathf.Abs (h) > 0.1 || Mathf.Abs (v) > 0.1;
		
	// Target direction relative to the camera
	var targetDirection = h * right + v * forward;
	
	// Grounded controls
	if (grounded)
	{
		// Lock camera for short period when transitioning moving & standing still
		lockCameraTimer += Time.deltaTime;
		if (isMoving != wasMoving)
			lockCameraTimer = 0.0;
			

		// We store speed and direction seperately,
		// so that when the character stands still we still have a valid forward direction
		// moveDirection is always normalized, and we only update it if there is user input.
		if (targetDirection != Vector3.zero)
		{
			if (v < 0) {
				moveDirection = Vector3.RotateTowards(moveDirection, -targetDirection, rotateSpeed * Mathf.Deg2Rad * Time.deltaTime, 1000);
				moveDirection = moveDirection.normalized;
				
			}
			else if (v == 0 && h != 0) {
				moveDirection = Vector3.RotateTowards(moveDirection, (h*right), rotateSpeed * Mathf.Deg2Rad * Time.deltaTime, 1000);
				moveDirection = moveDirection.normalized;
			}
			// If we are really slow, just snap to the target direction
			else if (moveSpeed < runSpeed * 0.9 && grounded)
			{				
				moveDirection = targetDirection.normalized;
							}
			// Otherwise smoothly turn towards it
			else
			{
				moveDirection = Vector3.RotateTowards(moveDirection, targetDirection, rotateSpeed * Mathf.Deg2Rad * Time.deltaTime, 1000);
				
				moveDirection = moveDirection.normalized;
			}
		}
		
		// Smooth the speed based on the current target direction
		var curSmooth = speedSmoothing * Time.deltaTime;
		
		// Choose target speed
		//* We want to support analog input but make sure you cant walk faster diagonally than just forward or sideways
		var targetSpeed = Mathf.Min(targetDirection.magnitude, 1.0);
	
		// Pick speed modifier
		if(Time.time - startedDashing <= 1.0){
			targetSpeed *= dashSpeed;
		}
		else {
			targetSpeed *= runSpeed;
		}
		_characterState = CharacterState.Running;
		
		moveSpeed = Mathf.Lerp(moveSpeed, targetSpeed, curSmooth);
		
	}
	// In air controls
	else
	{
		// Lock camera while in air
		if (jumping)
			lockCameraTimer = 0.0;

		if (isMoving)
			inAirVelocity += targetDirection.normalized * Time.deltaTime * inAirControlAcceleration;
	}
	

		
}

function ApplyJumping ()
{
	// Prevent jumping too fast after each other
	if (lastJumpTime + jumpRepeatTime > Time.time)
		return;
		
	if (IsGrounded() && canDoubleJump) {
		jumpsAvailable = 2;
	}
	else if (IsGrounded()) {
		jumpsAvailable = 1;
	}
		
	if(!IsJumping() && verticalSpeed < -2.0 && canDoubleJump) {
		jumpsAvailable = 1;
	}
	else if (!IsJumping() && verticalSpeed < -2.0) {
		jumpsAvailable = 0;
	}

	if (canJump && jumpsAvailable > 0) {
		if (Time.time < lastJumpButtonTime + jumpTimeout) {
			if(jumpsAvailable == 1 && canDoubleJump) {
				didDoubleJump = true;
			}
			jumpsAvailable--;
			verticalSpeed = CalculateJumpVerticalSpeed (jumpHeight);
			SendMessage("DidJump", SendMessageOptions.DontRequireReceiver);
		}
	}
}


function ApplyGravity ()
{
	if (isControllable)	// don't move player at all if not controllable.
	{
		// Apply gravity
		var jumpButton = Input.GetButton("Jump");
		
		// * When falling down we use controlledDescentGravity (only when holding down jump)
		var controlledDescent = canGlide && verticalSpeed <= 0.0 && jumpButton && jumping;
		
		// When we reach the apex of the jump we send out a message
		if (jumping && !jumpingReachedApex && verticalSpeed <= 0.0)
		{
			jumpingReachedApex = true;
			SendMessage("DidJumpReachApex", SendMessageOptions.DontRequireReceiver);
		}
	
		// * When jumping up we don't apply gravity for some time when the user is holding the jump button
		//   This gives more control over jump height by pressing the button longer
		var extraPowerJump =  IsJumping () && verticalSpeed > 0.0 && jumpButton && transform.position.y < lastJumpStartHeight + powerJumpHeight;
		
		if (controlledDescent)			
			verticalSpeed -= glideGravity * Time.deltaTime;
		else if (extraPowerJump && canPowerJump)
			return;
		else if (IsGrounded ())
			verticalSpeed = 0.0;
		else
			verticalSpeed -= gravity * Time.deltaTime;
	}
}

function CalculateJumpVerticalSpeed (targetJumpHeight : float)
{
	// From the jump height and gravity we deduce the upwards speed 
	// for the character to reach at the apex.
	return Mathf.Sqrt(2 * targetJumpHeight * gravity);
}

function DidJump ()
{
	jumping = true;
	jumpingReachedApex = false;
	lastJumpTime = Time.time;
	lastJumpStartHeight = transform.position.y;
	lastJumpButtonTime = -10;
	
	_characterState = CharacterState.Jumping;
}

function Update() {
	
	if (!isControllable)
	{
		// kill all inputs if not controllable.
		Input.ResetInputAxes();
	}

	if (Input.GetButtonDown ("Jump"))
	{
		lastJumpButtonTime = Time.time;
	}
	if (canDash)
		{
		if (Input.GetButtonDown("Vertical"))
		{
			if (Time.time - lastVerticalButtonPressed <= 0.25 && Time.time - startedDashing >= 1.0)
			{
				if (Input.GetAxis("Vertical") > 0 && lastVerticalValue > 0)
				{
					startedDashing = Time.time;
					didDash = true;
				}
			}
			lastVerticalButtonPressed = Time.time;
			lastVerticalValue = Input.GetAxis("Vertical");
		}
	}

	UpdateSmoothedMovementDirection();
	
	// Apply gravity
	// - extra power jump modifies gravity
	// - controlledDescent mode modifies gravity
	ApplyGravity ();

	// Apply jumping logic
	ApplyJumping ();
	
	// Calculate actual motion
	var movement;
	if (v < 0) {
		movement = -moveDirection * moveSpeed * 0.3 + Vector3 (0, verticalSpeed, 0) + inAirVelocity;
	}
	else {
		movement = moveDirection * moveSpeed + Vector3 (0, verticalSpeed, 0) + inAirVelocity;
	}
	//var movement = moveDirection * moveSpeed + Vector3 (0, verticalSpeed, 0) + inAirVelocity;
	movement *= Time.deltaTime;
	
	// Move the controller
	var controller : CharacterController = GetComponent(CharacterController);
	wallJumpContactNormal = Vector3.zero;
	collisionFlags = controller.Move(movement);
	
	// Set rotation to the move direction
	if (!jumping) {
		if(slammed) // we got knocked over by an enemy. We need to reset some stuff
		{
			slammed = false;
			//controller.height = 2;
			transform.position.y += 0.75;
		}
		transform.rotation = Quaternion.LookRotation(moveDirection);	
	}
	
	// We are in jump mode but just became grounded
	if (IsGrounded())
	{
		lastGroundedTime = Time.time;
		inAirVelocity = Vector3.zero;
		if (jumping)
		{
			jumping = false;
			SendMessage("DidLand", SendMessageOptions.DontRequireReceiver);
		}
	}
}

function OnControllerColliderHit (hit : ControllerColliderHit )
{
//	Debug.DrawRay(hit.point, hit.normal);
	if (hit.moveDirection.y > 0.01) 
		return;
	wallJumpContactNormal = hit.normal;
}

function GetSpeed () {
	return moveSpeed;
}

function IsJumping () {
	return jumping && !slammed;
}

function IsGrounded () {
	return (collisionFlags & CollisionFlags.CollidedBelow) != 0;
}

function SuperJump (height : float)
{
	verticalSpeed = CalculateJumpVerticalSpeed (height);
	collisionFlags = CollisionFlags.None;
	SendMessage("DidJump", SendMessageOptions.DontRequireReceiver);
}

function SuperJump (height : float, jumpVelocity : Vector3)
{
	verticalSpeed = CalculateJumpVerticalSpeed (height);
	inAirVelocity = jumpVelocity;
	
	collisionFlags = CollisionFlags.None;
	SendMessage("DidJump", SendMessageOptions.DontRequireReceiver);
}

function Slam (direction : Vector3)
{
	verticalSpeed = CalculateJumpVerticalSpeed (1);
	inAirVelocity = direction * 6;
	direction.y = 0.6;
	Quaternion.LookRotation(-direction);
	var controller : CharacterController = GetComponent(CharacterController);
	Debug.Log(controller.height);
	//controller.height = 0.5;
	slammed = true;
	collisionFlags = CollisionFlags.None;
	SendMessage("DidJump", SendMessageOptions.DontRequireReceiver);
}

function GetDirection () {
	return moveDirection;
}

function IsMovingBackwards () {
	return movingBack;
}

function GetLockCameraTimer () 
{
	return lockCameraTimer;
}

function IsMoving ()  : boolean
{
	return Mathf.Abs(Input.GetAxisRaw("Vertical")) + Mathf.Abs(Input.GetAxisRaw("Horizontal")) > 0.5;
}

function HasJumpReachedApex ()
{
	return jumpingReachedApex;
}

function IsGroundedWithTimeout ()
{
	return lastGroundedTime + groundedTimeout > Time.time;
}

function IsGliding ()
{
	// * When falling down we use controlledDescentGravity (only when holding down jump)
	var jumpButton = Input.GetButton("Jump");
	return canGlide && verticalSpeed <= 0.0 && jumpButton && jumping;
}

function Reset ()
{
	gameObject.tag = "Player";
}

function EnableDoubleJump()
{
	canDoubleJump = true;
}

function SetDidDoubleJump(did : boolean)
{
	didDoubleJump = did;
}

function GetDidDoubleJump()
{
	return didDoubleJump;
}

function EnableDash()
{
	canDash = true;
}

function SetDidDash(did : boolean)
{
	didDash = did;
}

function GetDidDash()
{
	return didDash;
}

function GetStartedDashing()
{
	return startedDashing;
}
// Require a character controller to be attached to the same game object
@script RequireComponent(CharacterController)
@script AddComponentMenu("Third Person Player/Third Person Controller")
