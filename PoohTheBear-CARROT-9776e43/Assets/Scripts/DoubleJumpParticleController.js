var particleSystem : GameObject;
function Start () {

	var playerController : ThirdPersonController = GetComponent(ThirdPersonController);
	
	// The script ensures an AudioSource component is always attached.
	
	// First, we make sure the AudioSource component is initialized correctly:
	audio.loop = false;
	audio.Stop();
	
	
	// Init the particles to not emit:
	var particles : Component[] = particleSystem.GetComponents(ParticleEmitter);
	
	for (var p : ParticleEmitter in particles)
	{
		p.emit = false;
	}

	// Once every frame  update particle emission
	while (true)
	{				
		var didDoubleJump = playerController.GetDidDoubleJump();
		// handle sound effect
		if (didDoubleJump)
		{
			if (!audio.isPlaying)
			{
				audio.Play();
			}
		}
		
		
		for (var p : ParticleEmitter in particles)
		{
			p.emit = didDoubleJump;
		}
		
		playerController.SetDidDoubleJump(false);
					
		yield;
	}
}

@script RequireComponent(AudioSource)