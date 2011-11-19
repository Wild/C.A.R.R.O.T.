// ThirdPersonStatus: Handles the player's state machine.

// Keeps track of inventory, health, lives, etc.


var health : int = 6;
var maxHealth : int = 6;
var lives = 4;

// sound effects.
var struckSound: AudioClip;
var deathSound: AudioClip;

private var levelStateMachine : LevelStatus;		// link to script that handles the level-complete sequence.

function Awake()
{
	
	levelStateMachine = FindObjectOfType(LevelStatus);
	if (!levelStateMachine)
		Debug.Log("No link to Level Status");
}

function ApplyDamage (damage : int)
{
	if (struckSound)
		AudioSource.PlayClipAtPoint(struckSound, transform.position);	// play the 'player was struck' sound.

	health -= damage;
	if (health <= 0)
	{
		SendMessage("Die");
	}
}


function AddLife (powerUp : int)
{
	lives += powerUp;
	health = maxHealth;
}

function AddHealth (powerUp : int)
{
	if(health == maxHealth) {
		AddLife(1);
	}
	else {
		health += powerUp;
	}
	
	if (health>maxHealth)		// We can only show six segments in our HUD.
	{
		health=maxHealth;	
	}		
}


function FalloutDeath ()
{
	Die();
	return;
}

function Die ()
{
	// play the death sound if available.
	if (deathSound)
	{
		AudioSource.PlayClipAtPoint(deathSound, transform.position);

	}
		
	lives--;
	health = maxHealth;
	
	if(lives < 0)
		Application.LoadLevel("GameOver");	
	
	// If we've reached here, the player still has lives remaining, so respawn.
	respawnPosition = Respawn.currentRespawn.transform.position;
	Camera.main.transform.position = respawnPosition - (transform.forward * 4) + Vector3.up;	// reset camera too
	// Hide the player briefly to give the death sound time to finish...
	//SendMessage("HidePlayer");
	
	// Relocate the player. We need to do this or the camera will keep trying to focus on the (invisible) player where he's standing on top of the FalloutDeath box collider.
	transform.position = respawnPosition + Vector3.up;

	//yield WaitForSeconds(1.6);	// give the sound time to complete. 
	
	// (NOTE: "HidePlayer" also disables the player controls.)

	//SendMessage("ShowPlayer");	// Show the player again, ready for...	
	// ... the respawn point to play it's particle effect
}

function LevelCompleted()
{
	levelStateMachine.LevelCompleted();
}