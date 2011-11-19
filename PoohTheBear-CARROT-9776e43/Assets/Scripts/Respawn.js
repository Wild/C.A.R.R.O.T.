var initialRespawn : Respawn;	

var RespawnState = 0;

static var currentRespawn : Respawn;

function Start()
{	
	RespawnState = 0;
	
	currentRespawn = initialRespawn;
}

function OnTriggerEnter()
{
	if (currentRespawn != this)	
	{
		currentRespawn.SetInactive ();
		currentRespawn = this;	
	}
}
