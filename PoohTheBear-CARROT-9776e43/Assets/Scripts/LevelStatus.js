// LevelStatus: Master level state machine script.


// This is where info like the number of items the player must collect in order to complete the level lives.

var itemsNeeded: int = 30;	// This is how many fuel canisters the player must collect.
var exitGateway: GameObject;
var levelGoal: GameObject;

var unlockedSound: AudioClip;
var levelCompleteSound: AudioClip;

var mainCamera: GameObject;
var unlockedCamera: GameObject;
var levelCompletedCamera: GameObject;

private var playerLink: GameObject;

// Awake(): Called by Unity when the script has loaded.
// We use this function to initialise our link to the Lerpz GameObject.
function Awake()
{
	levelGoal.GetComponent(MeshCollider).isTrigger = false;
	playerLink = GameObject.Find("Player");
	if(!playerLink)
		Debug.Log("Could not get link to Lerpz");
}	

function UnlockLevelExit()
{
	mainCamera.GetComponent(AudioListener).enabled = false;
	unlockedCamera.active = true;
	unlockedCamera.GetComponent(AudioListener).enabled = true;
	exitGateway.GetComponent(AudioSource).Stop();
	
	if(unlockedSound)
	{
		AudioSource.PlayClipAtPoint(unlockedSound, unlockedCamera.GetComponent(Transform).position,2.0);
	}
	
	yield WaitForSeconds(1);
	
	exitGateway.active = false;
	
	yield WaitForSeconds(0.05);
	exitGateway.active = true;
	yield WaitForSeconds(0.05);
	exitGateway.active = false;
	yield WaitForSeconds(0.05);
	exitGateway.active = true;
	yield WaitForSeconds(0.05);
	exitGateway.active = false;
	yield WaitForSeconds(0.05);
	exitGateway.active = true;
	yield WaitForSeconds(0.05);
	exitGateway.active = false;
	yield WaitForSeconds(0.1);
	exitGateway.active = true;
	yield WaitForSeconds(0.1);
	exitGateway.active = false;
	yield WaitForSeconds(0.2);
	exitGateway.active = true;
	yield WaitForSeconds(0.2);
	exitGateway.active = false;
	yield WaitForSeconds(0.3);
	exitGateway.active = true;
	yield WaitForSeconds(0.3);
	exitGateway.active = false;
	
	levelGoal.GetComponent(MeshCollider).isTrigger = true;
	
	yield WaitForSeconds(4);
	
	unlockedCamera.active = false;
	unlockedCamera.GetComponent(AudioListener).enabled = false;
	mainCamera.GetComponent(AudioListener).enabled = true;
}

function LevelCompleted()
{
	mainCamera.GetComponent(AudioListener).enabled = false;
	levelCompletedCamera.active = true;
	levelCompletedCamera.GetComponent(AudioListener).enabled = true;
	playerLink.GetComponent(ThirdPersonController).SendMessage("HidePlayer");
	playerLink.transform.position += Vector3.up*500.0;
	
	if(levelCompleteSound)
	{
		AudioSource.PlayClipAtPoint(levelCompleteSound, levelGoal.transform.position,2.0);
	}
	
	levelGoal.animation.Play();
	
	yield WaitForSeconds (levelGoal.animation.clip.length);
	Application.LoadLevel("GameOver");
}