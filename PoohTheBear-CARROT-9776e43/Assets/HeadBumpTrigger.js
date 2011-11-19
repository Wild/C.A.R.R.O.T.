
var boss : Collider;

function OnTriggerEnter (other : Collider)
{
	if (other != boss) {
		boss.SendMessage("HeadBump");
	}
}